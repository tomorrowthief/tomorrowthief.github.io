---
title: "DeepResearch"
date: 2025-09-24T17:27:00+08:00
draft: false
categories: '技术'
---
做通用智能体，首先从 DeepResearch 功能入手。几乎所有 AI应用 公司都会带这个功能。

在做过一些调研后，梳理下自己都这个功能的总结，理解。

## 首先 让一些出名的 DeepResearch 应用给出 DeepResearch 的调研报告
让我研究我自己？多少有点搞笑。

这个是让 manus 给的报告[manus deepresearch result](https://manus.im/share/H0Ky9vIrYboj6KKstrufrM?replay=1) 

提供的输入： 我要做一个deepresearch 的 agent 告诉我相关的概念，市面情况，实现方案，注意点，优化点

生成的 todo 如下
```markdown
## Deep Research Agent 研究任务

### Phase 1: 搜索和收集Deep Research Agent的基础信息
- [x] 收集Deep Research Agent的概念和定义
- [x] 收集Deep Research Agent的关键特性和能力

### Phase 2: 分析市场现状和竞争格局
- [x] 识别主要的Deep Research Agent产品和平台
- [x] 分析市场趋势和竞争优势

### Phase 3: 研究技术实现方案和架构
- [x] 探讨Deep Research Agent的常见技术栈
- [x] 了解多Agent系统和LLM编排

### Phase 4: 整理注意点和优化策略
- [x] 总结实现Deep Research Agent的挑战和注意事项
- [x] 提出性能、成本和准确性方面的优化建议

### Phase 5: 生成综合研究报告
- [x] 撰写Deep Research Agent的综合研究报告

### Phase 6: 向用户交付研究成果
- [ ] 将研究报告发送给用户



### Phase 7: 深入分析Deep Research Agent的商业应用场景
- [x] 深入分析Deep Research Agent的商业应用场景
```

## 主要组件
同普通 Agent 模式一样，但是针对学术总结等专业工具

核心工具如下
1. Web Search, Web Crawl
2. CodeSandbox
3. 专业知识提供入口

核心流程

<img alt="image" src="https://github.com/user-attachments/assets/841d122b-4bbf-4874-b903-45b231e4e97a" />


## 关键因素
### 知识源
这个是影响报告的最核心因素了。

1. 时效性
2. 内容质量
3. 未公开数据的获取

### 溯源
报告里的内容要指向源文档，这样给用户更高的灵活性及二次研究等，是一个非常好的用户体验

### 迭代反思
模型怎么基于现有的知识做反思，去补充一些深度知识

## 技术实现
基本属于一个多 Agent 架构 + Web Search + 专业知识检索工具

可以考虑使用 Camel，然后基于角色定义子Agent 完成整个技术架构方案

> 一切都是偶然 -- by 三体
