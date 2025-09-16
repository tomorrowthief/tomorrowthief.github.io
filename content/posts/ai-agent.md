---
title: "通用 Agent调研"
date: 2025-09-12T15:47:00+08:00
draft: false
categories: '技术'
---
近日接到通用智能体开发任务。类似 Manus，服务于公司内部一些场景，预计包含 PPT 制作，DeepResearch，小型开发任务等。

这里梳理下当前业界里的 通用 Agent。包含其产品特点，大致实现思路等。

## [manus](https://manus.im/app)

国内网红 Agent 公司，早期拼接炒作火了一把，并且把体验码炒到数万一个。也拿到了一些融资。

核心功能：

## [flowith](https://flowith.io/blank)

## [minimax](https://agent.minimaxi.com/)

## [skyework](https://skywork.ai/)

## [teamoteam](https://teamoteam.com/index)

一家国内的 Agent，创始人早期在百度的某AI算法团队，后离职专做这个 Agent。
主要应用场景是：写作，调研。属于一个典型的多 Agent 架构的应用。

<img width="1689" height="845" alt="image" src="https://github.com/user-attachments/assets/6bf9cec1-3341-476f-b14c-bb902d29612d" />

## 核心技术
### 单 Agent
目前单 Agent 基本都是源于早期那个 ReAct 论文。规划-响应-监听-循环。
### 多 Agent 架构
首先很多场景可能不需要 Multi Agent 架构
### 工具
### 调优
**效果调优**
**性能调优**：
这里有个 manus 的文章，其中写到了 prompt cache，比较底层技术了

## 是否有价值？
他是一个伪需求么？仅仅追随热点？发展一日千里？

这个问题的答案离不开场景，编码领域已经非常成功，写作，调研，等领域逐渐有显现，办公领域逐渐在渗透

## 其他产品罗列
1. [coze 空间](https://space.coze.cn/?category=10000)
2. [gamma](https://gamma.app/)


## 附录
1. [Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus](https://manus.im/zh-cn/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)
2. [writing-tools-for-agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
3. [ReAct 框架与 AI Agent：当 AI 学会自己思考和行动](https://baoyu.io/blog/react-ai-agent-self-thinking-acting)
4. [a-practical-guide-to-building-agents byopenai](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)
