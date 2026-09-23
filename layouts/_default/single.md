# {{ .Title }}

作者：{{ partial "author.html" . }}
原文：{{ .Params.canonicalURL | default .Permalink }}
发布日期：{{ .PublishDate.Format "2006-01-02" }}
更新日期：{{ .Lastmod.Format "2006-01-02" }}
语言：{{ .Language.Lang }}
{{ with .Description }}
摘要：{{ . }}
{{ end }}
---

{{ .RawContent }}
