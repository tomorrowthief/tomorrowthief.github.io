---
title: "通用 Agent 调研"
date: 2025-09-12T15:47:00+08:00
draft: false
categories: '技术'
---
近日接到通用智能体开发任务。类似 Manus，服务于公司内部一些场景，预计包含 PPT 制作，DeepResearch，小型开发任务等。

这里梳理下当前业界里的 通用 Agent。包含其产品特点，大致实现思路等。

## 与正常问答助手区别
普通 chat 是为了回答问题，仅仅是问答

带上工具后，可以执行一些简单任务

带上 多Agent 架构，复杂的工具（compute-use，codesandbox， browser-use），状态管理，Human in the loop，回放等就是本文要说的通用 Agent，我更习惯称它为任务 Agent。
## [manus](https://manus.im/app)

国内网红 Agent 公司，早期凭借炒作火了一把，当然也有他的实力存在的，并且把体验码炒到数万一个。也拿到了一些融资。
核心功能：

## [flowith](https://flowith.io/blank)

## [minimax](https://agent.minimaxi.com/)

## [skyework](https://skywork.ai/)

## [teamoteam](https://teamoteam.com/index)

一家国内的 Agent，创始人早期在百度的某AI算法团队，后离职专做这个 Agent。
主要应用场景是：写作，调研。属于一个典型的多 Agent 架构的应用。

<img width="100%" height="auto" alt="image" src="https://github.com/user-attachments/assets/6bf9cec1-3341-476f-b14c-bb902d29612d" />

## 核心技术
### 单 Agent
目前单 Agent 基本都是源于早期那个 ReAct 论文。规划-响应-监听-循环。
### 多 Agent 架构
首先很多场景可能不需要 Multi Agent 架构，具体怎么决策 在 Openai 总结的实践文章里有提到，可以做参考。
市面上已经有一些多 Agent 框架，比如 openai 的 swarm，qwen_agents 等。可以在代码实现上做些参考
### 状态管理
一般一个任务会对应一个总体的内容，任务的todo列表，todo的完成情况，human in the loop 等都依赖这个状态管理。
### 工具
工具基本依赖 mcp 协议，但是具体定义的时候有些注意事项：简洁，明确的描述工具，尽量给出 scope，因为不同的系列工具里可能有相同的名称比如： get_list。
### 调优
**效果调优**
这个是重中之重，

**性能调优**：
这里有个 manus 的文章，其中写到了 prompt cache，比较底层技术了。对于普通入门者我觉得可以往后再看。


## 其他产品罗列
1. [coze 空间](https://space.coze.cn/?category=10000)
2. [gamma](https://gamma.app/)

## 结论
目前还未存在真正通用 Agent，大概是 AGI 级别的模型还未出现。基本都是特定在某个领域内的通用，能做好的话也算是成功了

技术实现上思路：意图识别，任务拆解， 工具 / agent，状态控制，呈现结果。这其中的难点反倒是在工具的设计上了，有个好工具就能做出更好结果

一个 Demo 还是非常容易。但是调优性能这块却是另一个纬度的难题。

## 附录
1. [Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus](https://manus.im/zh-cn/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)
2. [writing-tools-for-agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
3. [ReAct 框架与 AI Agent：当 AI 学会自己思考和行动](https://baoyu.io/blog/react-ai-agent-self-thinking-acting)
4. [a-practical-guide-to-building-agents byopenai](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)
