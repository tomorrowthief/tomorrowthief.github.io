---
title: "Vibe Coding: Cursor & Claude Code 体验总结"
date: 2025-08-25T18:46:41+08:00
draft: false
categories: 'AI'
---

## 使用情况
目前编码工作几乎是 Cursor， 体验了 Claude code

主要使用场景：日常业务迭代，Bug 修复，新项目启动。

有 80% 的 coding 是生成的，能提升效率：50% +，更重要的是让自己有信心做一些未知领域的事情
## Cursor 等类似的工具
### Tab Tab Tab
Cursor 最基础的使用就是 Tab 接受了，然后也能自动计算焦点，这个也是早期他们宣传的一个点：Tab Tab Tab。

### Agent / Ask


### 上下文工程

### 多模态工程
前端场景里可以上传图片完成 UI 上的初稿。

### MCP
一些好用的 MCP: 查看最新文档


### 交互文档化
Kiro 里有个特别好的体验就是能提前设计方案，任务列表，执行计划等，并且能保存到文档里，支持手动编辑。这种交互比较适合初创型项目，或者复杂任务，不熟悉的领域里的任务.


## Claude
Claude 的交互本质是 cli 模式和 ui 可视化模式的对比，个人觉得长期对于大众用户来说 UI 可视化的界面会胜出。原因是历史数据来看的，历史上 cli 操作和可视化操作一般在很多软件里都会存在，各有利弊
各有千秋，功能上也几乎一致，最终UI可视化的交互会在更易被大众接受，在编码领域也是如此，这符合了人性中懒惰的一点，都是趋向于舒服的方向。

### 国内用户被限制？
某些原因导致 Anthropic 家的产品在国内是被限制的，Claude 也一样。

但是出现了很多开源的代理项目，大概是通过抓包把 Claude 中的请求都拿到，然后转发到本地启动的代理服务。比较出名的是 [ccr](https://github.com/musistudio/claude-code-router) 我是在用这个

具体是使用公司的提供的百炼接口 Api key。里面有很多开源模型可以选择比如 Qwen系列，Kimi K2，Deepseek3.1 等。我在用 Claude + deepseek-v3.1。

效果上据听说可以达到其 claude 4系列模型的 8 成。可以想象到 claude 4系列是多么恐怖


### SubAgents
subAgent 模式我非常看好。他好处是能减少上下文窗口占用

可以用牛马来形容这些 Subagent 了。

一些优秀的列表如下：[https://github.com/wshobson/agents](https://github.com/wshobson/agents)


## 当个正儿八经的同事
借助这些工具，当作一个正儿八经的同事来对待，能在另一个纬度提升工具的战斗力。





## 虚拟团队？





> 工欲善其事 必先利其器
