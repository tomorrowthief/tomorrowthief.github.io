---
title: "WebGl-Hub-[Apps by AI Coding tool]"
date: 2025-10-17T16:59:00+08:00
draft: false
categories: 'AI'
tags: ['AI Coding', 'Vibe-coding Apps']
---
记录下自己做的一些 Apps，基本是网页形态，后面会考虑浏览器插件等形态。

会着重记录，功能，实现思路 体验地址。

主打一个纯自然语言，AI 做牛马。期望能把这个过程用熟练，万一真有场景可以直接用上呢。
## Webgl 学习网站

[https://webgl-hub.pages.dev/](https://webgl-hub.pages.dev/)

### 功能
- 提供 Webgl 及 threejs 概念学习，案例学习
- 提供在线代码编辑和运行环境

### 大概过程
**step1**Google AI studio build 生成基础版本：
1. 基础工程，脚手架：案例列表，案例详情
2. 样式主题等

**step2**然后下载到本地使用 claude code 完成：
1. 案例补充
2. 高级案例


### 部署
cloudflare pages


### 遇到的问题
案例代码写完后，试试运行报错

实时运行运行的技术方案是人引导AI给出来的，通过构建一个 function 函数，函数主体是 编辑好的代码，然后执行。
但是代码里有些变量是预定义的，比如 threejs 的库变量 THREE，这些变量在 function 里是不可见的，所以会报错。

解决方案：引导 claude code 通过cdn的形式引入包，然后将 THREE 挂载到 window 下，作为全局包。当然这一步 AI 充当的是执行决赛，解决方案是人想出来的。

### 总结
这个项目总体比较简单，核心技术方案应该算是 人主导 + AI辅助完成的

人的角色是设计师，架构师，AI 是程序员。模型能力进一步提升后，人的角色会越来越像产品经理和设计师，AI 会承担更多的技术工作。