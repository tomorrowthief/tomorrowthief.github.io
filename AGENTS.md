# 仓库协作说明

## 推送与认证

- 本仓库必须使用 API token，通过 **GitHub REST API** 发布提交和更新分支。不要使用 SSH 或普通 `git push` 作为默认推送方式。
- 仓库：`tomorrowthief/tomorrowthief.github.io`；生产分支：`main`。
- Token 文件实际位置：`/Users/zhongling/.github_token`（即 `~/.github_token`），不是仓库根目录。只在请求时从文件读取。
- API 基址：`https://api.github.com/repos/tomorrowthief/tomorrowthief.github.io`。
- 认证请求头：`Authorization: Bearer <从文件读取的 token>`；同时设置 `Accept: application/vnd.github+json`、`X-GitHub-Api-Version: 2022-11-28` 和 `User-Agent`。
- 当前环境曾出现 `github.com:443` 连接失败，但 `api.github.com` 可访问。直接走 API，无需先尝试普通 Git 网络推送。

### 发布流程

1. 检查 `git status`、改动内容和暂存区，只提交当前任务范围内的文件。保留用户的其他改动，尤其不要顺手提交 `.DS_Store`、未获授权发布的文章或凭据文件。
2. 通过 `GET /git/ref/heads/main` 获取远程最新提交。若远程领先，先通过 API 比较提交并保留远程变更；不能用旧的本地树覆盖最新远程内容。
3. 构建和检查通过后，创建本地提交。提交说明使用简洁的英文祈使句。
4. 使用 Git Data API 上传改动：
   - `GET /git/commits/{sha}`：读取最新父提交及其树。
   - `POST /git/trees`：以最新远程树作为 `base_tree`，只提交本次变化的路径；文本文件可使用 `content`，二进制文件先通过 `POST /git/blobs` 上传。
   - `POST /git/commits`：创建提交，以最新远程提交作为 `parents`。保留本地提交的作者、提交者、时间和完整提交说明，并核对生成的树及提交 SHA。
   - 再次读取远程分支，确认父提交没有变化。
   - `PATCH /git/refs/heads/main`：提交新 SHA，**始终使用 `force: false`**。
5. 若远程在操作期间更新，停止分支更新，重新基于最新提交整合改动；禁止强制覆盖。
6. 再次读取远程分支确认发布成功，并同步本地远程跟踪引用。若 API 创建的提交与本地 SHA 不一致，先核对 Git 对象，避免留下本地与远程分叉。仅在对象已获取、哈希验证通过后更新本地引用；不要用 `reset --hard` 清理用户工作区。
7. API 更新分支若发生超时，先查询远程 SHA 确认是否已成功，不要盲目重复创建提交。

### 凭据保护

- 不打印、回显、记录或提交 token；不将 token 放进远程 URL、命令行参数、补丁、文档或日志。
- 使用程序从文件读取 token 并设置 HTTP 请求头，关闭包含认证信息的调试输出。报错输出需脱敏。
- `.github_token` 不得进入暂存区。token 缺失、认证失败或权限不足时，说明具体问题，不猜测凭据，也不扩大权限。

## 构建与部署验证

- 主域名：`https://zhixia.pages.dev/`，由 `config.yml` 的 `baseURL` 统一控制。
- Hugo Extended 版本：`0.148.2`。
- 构建：`hugo --minify --cleanDestinationDir`。
- 检查：`python3 scripts/check_seo.py docs` 和 `git diff --check`。
- `docs/` 是生成目录，不提交。新增源文件需要一并提交。
- 更新 `main` 后会触发已连接的 Cloudflare Pages 和 GitHub Actions。可通过 `GET /commits/{sha}/check-runs` 查询部署结果；推送成功与部署成功需要分别确认。
- 部署后检查主站的 `/llms.txt`、`/robots.txt`、`/sitemap.xml`。曾观察到默认 `Python-urllib` User-Agent 返回 403，而浏览器 User-Agent 的请求返回 200；不要仅凭单一客户端响应判定部署失败，也不要将模拟爬虫标识访问成功当作真实搜索平台已经收录。
