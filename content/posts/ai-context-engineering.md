---
title: "[Webgl-learn] Vibe Coding 实践"
date: 2026-05-27T10:25:41+08:00
draft: false
categories: 'AI'
tags: ['AI', 'Vibe Coding', 'Context Engineering']
---

# 背景
这是另一篇vibe coding实践，之前已经有一个实践：基于当时的工具做的，现在呢基于最新的 claude code 加上 deepseek/glm-5.1 做的，然后过程是基于 superpower 来做流程控制。基于此详细说下怎么做的

# 国内 Vibe coding 
claude code + deepseek-v4pro/glm-5.1 的组合方式已经能胜任 90% + 的日常工作了。


# 项目描述
一个学习 Webgl threejs网站。系统学习，主要是基于案例的方式，能实操，能实时预览。整个产品包含两块，列表，和详情。

# vibe 过程
使用的工具：
* 龙虾
* claude code

## 初始化
使用龙虾 + deepseek 0 到 1 创建项目，龙虾里本来已经配置好一个研发团队了，包含产品。设计，架构，研发，测试角色

## 修复问题
出现了一个最大的渲染问题，龙虾一直渲染修复，无结果尝试 claude code + glm5.1。稍微有点感觉，但是依然不能解决问题依然陷入。这个时候主动干预，告诉他思路，让他先分析 渲染流程及涉及的模块，然后再告诉他排查思路，在末尾节点到开始节点依次排查，使用mock的形式，开始见效，几轮次下来，问题得到修复。最小demo 跑通

## 补充demo

使用 cc glm5.1。补充系统性的案例素材，过程中触发了superpower的流程，human in the loop 来完成案例补充


## 成果

github：https://github.com/tomorrowthief/webgl-learn
部署方式：cloudflare
链接：https://webgl-learn.pages.dev/


# 最大的问题
遇到了预览失败问题，核心渲染的内容是用一个 sandbox来做的，其实是一个独立的html 在这个 html 里加载一些库，threejs 等。通过postmessage 来接收代码，渲染。所以渲染流程模块上有 3个 源码展示 --> sandbox --> 执行代码。

刚开始页面直接是白的，然后一句话加上截图告诉 他修复，执行了很多轮次，也没好




### 问题小节

* 或许开始就使用 claude 或者 gpt5.5 等就不会出现这个问题
* 或许在技术架构上指明一些，也能避免
* 修复过程中 工具陷入了无限循环，没有人工干预很难跳出
* 关键架构还是得人类 review


# 感受
就直接给几个爆论：

* 当前时间的 工具 + 模型，已经能胜任 90% + 的编码工作
* 架构还是最关键的，这个得人review
* 新项目使用 openspec 或者 superpower 等其他认为合理的研发流程还是很有必要，但是具体怎么使用得看具体项目
* glm5.1 编码能力强于 deepseek，deepseek 更像是文科生，glm5.1 更像是理科生





