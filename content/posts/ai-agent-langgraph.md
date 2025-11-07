---
title: "Langgraph深度学习"
date: 2025-11-05T09:30:00+08:00. 
draft: false
categories: '技术'
tags: ['AI', 'Agent']
---

最近做通用 Agent 技术选型上有两个方向： 1. vanilla agent 2. 框架（langgraph agent， crew AI）等。最终考虑到细节上选择了框架方向，具体框架选择了 langgraph。

langgraph 呢是 langchain 团队做的一个底层 Agent 开发框架，其上 langchain 就是基于 langgraph 做的。我对 langchain 的认知还停留在 2023 年，彼时他只是一个简单的链式反应工具，做Agent 很重不够灵活，我呢一直是鄙视的态度看待。用他的产品也是仅用了他的文档处理相关的，比如confluence解析等。

最近他们突然融资到 1.25 亿刀
<img  alt="26037358678547549" src="https://github.com/user-attachments/assets/d22b1f2e-5c8b-4d69-9657-b4264be241e2" />，
然后工作需要，就去仔细研究了下他的底层 langgraph，这一看扫去了我之前对他的认知。下面细说下


## Langgraph 的能力
核心是任务执行编排

其次是与模型相关的基础组件介入，可以方便的介入到任务编排流程里

## 设计理念
文档的 Thinking in Langgraph 部分讲了如何将一个任务传统任务落地带 Langgraph里，要先考虑怎么把任务拆成离散的 `单点任务`, 单点任务之间的`流转关系`是如何的。

其中单点任务就是 Node 流转关系，对应 Edge。跟 AI 核心的关系是依赖 LLM 来做一些 Node 之间的动态跳转。自主规划跳转逻辑。


有个中央 Store 来存储 State。每个 Node 是一个 Function，输入 State 输出 State，或者输出 Command。Command 是内部的一个模式，Command里包含了State更新内容，及下一跳的目的

## 似曾相识
State 的设计：函数式编程的思想。跟当初学习前端开发里 的 React 里的状态库 Rudux 库很相似。也获取所有复杂状态管理都是大概的吧

更改State的方式：

```python
# langgraph 里更改 State 的方式
def node_1(state: InputState) -> OverallState:
    # Write to OverallState
    return {"foo": state["user_input"] + " name"}
```

```js
// Redux 里更改 State 的方式
function reducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_FOO':
      return { ...state, foo: action.payload };
    default:
      return state;
  }
}
```

总体都是 state in -> process - > state out 的设计思想

应了那句话：技术思想都大概的，只是在不同的应用场景下有不同的实现罢了

## 一个孜孜不倦的成功者
