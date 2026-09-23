# 钟灵毓秀

Hugo 个人博客，记录 AI Agent、软件开发、读书与生活思考。

主站：[zhixia.pages.dev](https://zhixia.pages.dev/)。备用部署：[GitHub Pages](https://tomorrowthief.github.io/)。
**搜索引擎使用的主域名由 `config.yml` 的 `baseURL` 统一决定**，已设置为 `https://zhixia.pages.dev/`。两个站点部署同一份内容时应使用同一个 `baseURL`，让 canonical、RSS、站点地图及 AI 检索入口统一指向主站。重新部署备用站后，其 canonical 也会指向主站；GitHub Pages 的默认域名无法直接用 `_redirects` 设置 301 跳转。

## 本地构建与检查

使用 Hugo Extended 0.148.2（与 GitHub Actions 一致）：

```sh
hugo server
# 发布前使用 production 构建；默认 hugo build 即为 production。
hugo --minify --cleanDestinationDir
python3 scripts/check_seo.py docs
```

不要发布 `hugo server` 的开发输出：开发模式的 robots 和页面 meta 会禁止收录。`docs/` 是生成目录，不提交。Cloudflare 构建环境建议配置 `HUGO_VERSION=0.148.2`，构建命令为 `hugo --minify`，输出目录为 `docs`。`static/_headers` 仅由 Cloudflare Pages 读取。

检查脚本覆盖页面描述、canonical 与 Open Graph 一致性、分页地址、JSON-LD、站点地图、AI 爬虫可访问性、文章 Markdown 和 RSS。GitHub Actions 在部署前执行该检查。

## 已提供的检索入口

- `/sitemap.xml`：HTML 页面地图，排除搜索页与 `noindex: true` 页面。
- `/robots.txt`：生产环境允许所有爬虫，包括 Googlebot、Bingbot 和 AI 搜索爬虫；保留原先的通用开放策略。这不表示必须开放训练爬虫，若日后调整，应区分搜索与训练用途。
- `/llms.txt`：从已发布文章自动生成的内容目录，包含摘要、原文和 Markdown 地址。
- `/posts/<slug>/index.md`：与 HTML 同源的正文，带作者、原文 URL、发布及更新日期；原始标题中的 AI 代写标注会保留。HTML head 与文章信息栏均提供入口。
- `/index.xml`：仅包含文章的 RSS；原有 `/index.json` 继续供站内搜索使用。

页面使用 `WebSite`、`Person`、`BlogPosting`、`AboutPage`、`CollectionPage` 及 `BreadcrumbList` 表达实际内容。正文保持静态 HTML，不依赖 JavaScript 才能读取。没有实际翻译的英文站点已禁用；有翻译后再调整 `disableLanguages`。

`llms.txt` 是可选的社区提案，并非 Google/AI 平台的收录标准或排名保证。主要工作仍是让内容可抓取、有清晰主题、可核验、易于引用。参考：[Google AI 搜索与网站](https://developers.google.com/search/docs/appearance/ai-features)、[llms.txt 提案](https://llmstxt.org/)、[OpenAI 爬虫用途](https://developers.openai.com/api/docs/bots)。

## 写作与维护

新建文章时填写 `description`：用 1–2 句说明解决的问题、适用场景与主要结论，避免堆关键词。缺少时自动使用纯文本摘要；关键技术文章已补充独立摘要。

```yaml
title: "描述具体问题的标题"
date: 2026-09-23T10:00:00+08:00
description: "说明文章面向谁、解决什么问题，以及覆盖的主要方法。"
tags: [AI, Agent]
categories: 技术
draft: false
# 仅在实质更新正文后填写真实时间，不随每次构建刷新。
# lastmod: 2026-09-24T10:00:00+08:00
```

在正文开头交代结论或适用范围，用描述性小标题组织步骤和限制，为技术结论、数据与引文提供原始来源。保留 AI 辅助写作标注，补充亲自验证的结果，不为 SEO 虚构经历或 FAQ。图表尽量同时提供文字解释。

本地覆盖模板位于 `layouts/`，不修改主题子模块。升级主题时需比较 `head.html`、`post_meta.html` 与 `rss.xml` 的变化，并运行检查。

## 上线后的站长操作

1. 在 Google Search Console 与 Bing Webmaster Tools 验证最终主域名的所有权，提交该域名的 `/sitemap.xml`。
2. 如使用 HTML 验证码，可在 `params.analytics` 配置 `googlesiteVerificationTag`、`bingsiteVerificationTag`，填入真实验证码，不填示例值。
3. 用 URL 检查和 Rich Results Test 检查首页与代表性文章，确认服务器返回 200、canonical 正确、正文可抓取。若 Cloudflare 使用 bot protection，检查是否向搜索爬虫返回挑战页。
4. 后续通过站长平台查看收录、抓取错误和查询表现；本地构建成功不代表已完成线上部署或平台收录。
