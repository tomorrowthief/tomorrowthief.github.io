---
title: "Python 学习总结"
date: 2024-06-22T10:47:41+08:00
draft: false
categories: '技术'
---

## 为什么要学 Python
最近开始接触 Ai 相关的东西。主要是应用层的内容，比如 RAG Agent 等。此类应用特点：无需太多安全性能，偏向于工具，这块技术发展变化比较迅速，大模型日新月异，应用层技术也跟随变化较多。

根据此特点选择脚本类型语言作为应用层开发语言。待选语言有 `Nodejs` `python`。 个人虽熟悉 Nodejs，但鉴于 Python 生态较好 性能较好等，最后决定 Python。

## Python 综述
Python 第一版本发布于 2000年，目前在 Tiobe 排行榜里人数排名第一，社区热度也升为第一。
* 定位：高级语言，通用能力编程语言
* 特性：动态语言，基于解释器，gc 等
* 范式：函数编程，面向对象，面向过程

主要在 数据处理，计算，Web等发挥作用，AI 领域使用很多， Web 开发也有很多场景

运行模式支持 多进程，多线程，协程

## 执行流程
> 这一章直接问了 gpt，下面都是 ai 的回答

在Python中，程序的执行流程通常是按照以下步骤进行的：

1. 解释器读取源代码：Python解释器会逐行读取源代码文件，并将其转换为字节码形式，这是一种中间表示形式，可以被Python虚拟机执行。

2. 词法分析和语法分析：在这个阶段，Python解释器会将源代码分解成单词（Token）并构建语法树。这个过程包括词法分析（将源代码分解为Token）和语法分析（根据语法规则构建语法树）。

3. 编译字节码：Python解释器将语法树转换为字节码。字节码是一种中间形式，类似于机器码，但是不是针对特定的硬件架构。

4. 执行字节码：Python虚拟机执行字节码指令。这些指令会被逐条执行，从而实现程序的逻辑。

5. 动态类型检查：Python是一种动态类型语言，因此在运行时会进行类型检查。如果类型不匹配，会引发类型错误。

6. 垃圾回收：Python具有自动内存管理机制，包括垃圾回收。垃圾回收器会定期检查不再使用的内存对象，并释放它们。

7. 异常处理：在程序执行过程中，如果发生异常，Python会查找合适的异常处理程序。如果找不到合适的处理程序，程序会中止并打印错误信息。

8. 程序结束：当程序执行完所有的代码或遇到显式的退出语句（如return或sys.exit()）时，程序结束执行。

## 全局解释性锁
比较独特的一个特性。是 Cpython 里保证同一时刻只能有一个线程来执行字节码，很明显这个单线程是并发的模型，而非并行模型。

缺点：很明显不能做并行，多核心硬件优势难以体现
优点：线程安全，内存安全（似乎只对 cpython 团队友好，对那些用 c 写库的友好）

## 异步编程
Python里的异步编程也经历过一些迭代，基础上是基于时间循环的协程操作。早期用gevent，现在也有很多在用，当下内置模块 asyncio 也实现了相关的封装，可以更加方便的定义异步任务，执行异步任务。 

相比我比较熟悉的 Javascript 里浏览器和 Nodejs 运行时的模式，Python多少还是有点不同： Js 语言里都是默认开启异步的，因为在 js 引擎执行开始就启动了事件循环，而Python不同，需要手动的去开启事件循环来启动异步操作。从这个角度来看，Python 提供了很多底层的 API，让使用者灵活的控制。好处是可以更灵活，性能上更好些，坏处是需要很多底层知识来支撑，否则用不好的话，反倒影响性能

### 基本概念
- **事件循环**：管理和调度异步任务的核心组件。
- **协程**：使用 `async def` 定义的函数，可以在事件循环中异步运行。
- **任务**：由事件循环调度的协程对象。
- **Future**：表示一个异步操作的最终结果，类似于 JavaScript 中的 `Promise`。

### 示例
以下是一个简单的示例，展示了如何使用 `asyncio` 模块来创建和运行事件循环：

```python
import asyncio

async def say_hello():
    print('Hello')
    await asyncio.sleep(1)
    print('World')

async def main():
    await asyncio.gather(say_hello(), say_hello())

# 获取默认事件循环并运行主协程
asyncio.run(main())
```

### 解释
1. **定义协程**：使用 `async def` 定义了一个名为 `say_hello` 的协程，它在打印 `Hello` 后等待 1 秒，然后打印 `World`。
2. **主协程**：定义了一个名为 `main` 的协程，它使用 `asyncio.gather` 并发地运行两个 `say_hello` 协程。
3. **运行事件循环**：使用 `asyncio.run` 获取默认事件循环并运行 `main` 协程。
### 事件循环的工作原理
1. **启动事件循环**：当调用 `asyncio.run(main())` 时，事件循环启动并开始运行 `main` 协程。
2. **调度任务**：事件循环调度 `main` 协程中的任务。在这个例子中，`asyncio.gather` 会并发地运行两个 `say_hello` 协程。
3. **处理 I/O 操作**：当协程遇到 I/O 操作（如 `await asyncio.sleep(1)`），事件循环会挂起该协程并切换到其他可运行的任务。
4. **完成任务**：当 I/O 操作完成时，事件循环会恢复被挂起的协程并继续执行。
5. **结束事件循环**：当所有任务完成时，事件循环停止。
### 更复杂的示例
以下是一个更复杂的示例，展示了如何处理多个异步任务和超时：
```python
import asyncio

async def fetch_data(delay, name):
    print(f'Starting {name}')
    await asyncio.sleep(delay)
    print(f'Finished {name}')

async def main():
    task1 = asyncio.create_task(fetch_data(2, 'Task 1'))
    task2 = asyncio.create_task(fetch_data(3, 'Task 2'))
    task3 = asyncio.create_task(fetch_data(1, 'Task 3'))

    await asyncio.wait([task1, task2, task3], timeout=2.5)

# 运行事件循环
asyncio.run(main())
```
### 解释
1. **创建任务**：使用 `asyncio.create_task` 创建了三个任务，每个任务在不同的延迟后完成。
2. **等待任务**：使用 `asyncio.wait` 并设置超时时间为 2.5 秒。如果某些任务在超时时间内未完成，它们将被取消。
### 输出结果
```
Starting Task 1
Starting Task 2
Starting Task 3
Finished Task 3
Finished Task 1
```

在这个例子中，`Task 2` 因为超时而未能完成。

### 处理超时
如果你需要处理超时，可以使用 `asyncio.TimeoutError`：

```python
async def main():
    try:
        await asyncio.wait_for(fetch_data(3, 'Task 2'), timeout=2)
    except asyncio.TimeoutError:
        print('Task 2 timed out')

asyncio.run(main())
```

### 本章小节
Python 的 `asyncio` 模块提供了强大的工具来编写高效的异步 I/O 代码。通过理解事件循环、协程和任务的工作原理，可以更好地编写和调试异步 Python 程序。

比较有意思的是， Javascript 里并没有提供事件循环的底层 API，而 Python 却提供了很多。从这点来看Python灵活性更好，在需要充分榨干 cpu 的场景中会有更好的表现，就像 C++ 提供了垃圾回收的低层级API，而 Java 则直接用Jvm 的 gc 机制来做，使得 c++ 性能更强，更灵活, 当然编写难度也会提升，实际技术选型时要综合考虑。

本章多列举了一些案例，因为我觉得大部分场景都会用到异步编程，而需要进程模型相关的一般交给其他语言处理了
## 并发控制
* 支持进程模型，线程模型
* 有原生的线程池对象
* 有队列的原生对象
* 协程信号量等
## 语法
使用缩进来表示一些行为

非常灵活，以至于我现在还是新手。
### 魔法函数
通过魔法函数机制让语言使用者可以做很多元编程的事情：修改默认行为。

* __init__
* __getitem__
* ……
需要的话直接翻阅手册吧
### 记忆深刻的语法
* 列表推导
* 函数变量：位置变量，关键字变量
* 小括号很少
* 数组各种切片，数组相加
## 优秀框架库
* Web服务开发： Flask FastAPI
* 任务队列： Celery
* 很多 Agent
* 数据开发相关: Panda Numpy
* 深度学习： PyTorch Tenserflow
* 图数据库： Neo4j
## 社区关注
会关注社区里的 Python core dev 成员。其中有一个是中国人：高天，在 B站 上看过他不少视频，讲的都是比较基础的，比较内核的。

## 总结
入门比较容易。本文内容主要是我在做两个项目中 学习到的一些概念，知识点。感觉目前能成为一个中级开发了。如果后面用了一些其他高级功能，再专题写一下具体的部分

到了一定程度语言已经不是问题的关键了，怎么熟悉整个技术体系更重要，比如在Web服务开发领域：计算机组成，操组系统，编译原理，等基础概念，数据库，高并发，分布式这些架构。
