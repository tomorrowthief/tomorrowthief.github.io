#!/usr/bin/env python3
"""Validate the built site using only Python's standard library."""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from urllib.robotparser import RobotFileParser
from xml.etree import ElementTree as ET


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.meta, self.links, self.schemas, self.headings = [], [], [], []
        self.title = ""
        self.capture = None
        self.buffer = ""
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            self.meta.append(attrs)
        if tag == "link":
            self.links.append(attrs)
        if tag in ("h1", "title") or (tag == "script" and attrs.get("type") == "application/ld+json"):
            self.capture, self.buffer = tag, ""

    def handle_data(self, text):
        if self.capture:
            self.buffer += text

    def handle_endtag(self, tag):
        if tag != self.capture:
            return
        if tag == "script":
            self.schemas.append(json.loads(self.buffer))
        elif tag == "h1":
            self.headings.append(self.buffer)
        elif tag == "title":
            self.title = self.buffer
        self.capture = None

    def values(self, key):
        return [m.get("content", "") for m in self.meta if m.get("name", m.get("property")) == key]


def check(root):
    root = root.resolve()
    home = Page((root / "index.html").read_text())
    origin = next(link["href"] for link in home.links if link.get("rel") == "canonical")
    base = urlsplit(origin)

    def local_file(url):
        parsed = urlsplit(url)
        assert parsed.scheme == "https" and parsed.netloc == base.netloc, f"Unexpected origin: {url}"
        assert parsed.path.startswith(base.path), f"Outside base path: {url}"
        relative = unquote(parsed.path[len(base.path):])
        path = root / relative
        if parsed.path.endswith("/"):
            path /= "index.html"
        assert path.is_file(), f"Missing URL target: {url}"
        return path

    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    sitemap = ET.parse(root / "sitemap.xml")
    urls = [node.text for node in sitemap.findall("s:url/s:loc", namespace)]
    assert urls and len(urls) == len(set(urls)), "Empty or duplicate sitemap"
    indexed = set(urls)
    for url in urls:
        page = Page(local_file(url).read_text())
        assert "noindex" not in ",".join(page.values("robots")), f"Noindex URL in sitemap: {url}"
    assert not (root / "en").exists(), "Empty English site should not be published"

    llms = (root / "llms.txt").read_text()
    assert llms.startswith("# ") and "## 文章" in llms
    for url in re.findall(r"\]\((https://[^\s)]+)\)", llms):
        local_file(url)

    robots = RobotFileParser()
    robots.parse((root / "robots.txt").read_text().splitlines())
    assert origin + "sitemap.xml" in (robots.site_maps() or [])
    for agent in ("Googlebot", "bingbot", "OAI-SearchBot", "Claude-SearchBot", "PerplexityBot"):
        assert robots.can_fetch(agent, origin + "posts/"), f"Crawler blocked: {agent}"

    pages = articles = 0
    for path in root.rglob("*.html"):
        page = Page(path.read_text())
        if any(m.get("http-equiv", "").lower() == "refresh" for m in page.meta):
            continue  # Hugo's page/1 and taxonomy aliases.
        pages += 1
        assert page.title.strip(), f"Missing title: {path}"
        descriptions = page.values("description")
        assert len(descriptions) == 1 and descriptions[0].strip(), f"Missing or duplicate description: {path}"
        assert not re.search(r"</?[a-zA-Z][^>]*>", descriptions[0]), f"HTML in description: {path}"
        canonical = [link["href"] for link in page.links if link.get("rel") == "canonical"]
        assert len(canonical) == 1, f"Missing or duplicate canonical: {path}"
        assert local_file(canonical[0]) == path, f"Canonical points elsewhere: {path}"
        assert page.values("og:url") == canonical, f"OG/canonical mismatch: {path}"
        assert page.values("og:description") == descriptions == page.values("twitter:description"), path
        graph = [node for schema in page.schemas for node in schema.get("@graph", [schema])]
        posts = [node for node in graph if node["@type"] == "BlogPosting"]
        is_article = path.parent.parent == root / "posts"
        noindex = "noindex" in ",".join(page.values("robots"))
        assert len(posts) == int(is_article and not noindex), f"Incorrect article schema: {path}"
        if is_article:
            articles += 1
            markdown = path.with_suffix(".md")
            assert markdown.is_file(), f"Missing Markdown: {path}"
            text = markdown.read_text()
            assert canonical[0] in text and text.startswith("# "), f"Missing provenance: {markdown}"
            alternate = [link for link in page.links if link.get("type") == "text/markdown"]
            assert len(alternate) == 1 and local_file(alternate[0]["href"]) == markdown
            if not noindex:
                assert canonical[0] in indexed and canonical[0] in llms, f"Article undiscoverable: {path}"
                assert posts[0]["dateModified"] >= posts[0]["datePublished"], path
        for node in graph:
            if node["@type"] == "BreadcrumbList":
                items = node["itemListElement"]
                assert [i["position"] for i in items] == list(range(1, len(items) + 1)), path
                for item in items:
                    local_file(item["item"])
    for name in ("search/index.html", "404.html"):
        assert "noindex" in ",".join(Page((root / name).read_text()).values("robots"))
    assert home.headings, "Missing homepage H1"
    feed = ET.parse(root / "index.xml")
    for item in feed.findall("channel/item"):
        assert "/posts/" in item.findtext("link"), "Non-article in RSS"
        local_file(item.findtext("link"))
    print(f"SEO checks passed: {pages} HTML pages, {articles} articles, {len(urls)} sitemap URLs.")


if __name__ == "__main__":
    check(Path(sys.argv[1] if len(sys.argv) > 1 else "docs"))
