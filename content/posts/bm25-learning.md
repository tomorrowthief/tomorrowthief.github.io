---
title: "BM25 学习总结：从打分公式到 Milvus 稀疏/稠密混合检索"
date: 2026-06-25T19:00:00+08:00
draft: false
categories: '技术'
tags: ['BM25', 'Milvus', 'Elasticsearch', '检索', 'RAG']
---

> 从「BM25 是什么」一路到「Milvus 稀疏/稠密混合检索、ES 分词器、倒排索引、词表维护」的完整学习笔记。适合做过关键词检索、想搞懂 BM25 在现代向量检索体系里位置的同学。

## 0. 一张图先建立全局认知

```
文本 ─①分词器(analyzer)──> 词项 ─②索引引擎──> 词表 + 倒排索引 ─③BM25──> 权重/分数
                              ↑ 谁负责什么 ↑
        分词=analyzer      词表/索引=Milvus/ES       打分=BM25(只是消费者)

稠密向量 = 模型编码(语义)     稀疏向量 = BM25/SPLADE 登记词项(词法)
Hybrid Search = 在「排名层」融合稀疏 + 稠密
```

记住这张图，后面的所有细节都是对它的展开。最关键的一点：**BM25 只负责「打分」，不管分词、不管建索引、不管维护词表。**

## 1. 认识 BM25

### 1.1 它是什么

BM25（Best Match 25）是信息检索领域最经典、应用最广的排序算法，是 TF-IDF 的改进版本，也是 Elasticsearch、Lucene、Solr 等搜索引擎的**默认打分函数**。

### 1.2 打分公式

给定查询 $q$ 和文档 $d$：

$$\text{score}(d, q) = \sum_{t \in q} \text{IDF}(t) \cdot \frac{f(t, d) \cdot (k_1 + 1)}{f(t, d) + k_1 \cdot \left(1 - b + b \cdot \frac{|d|}{\text{avgdl}}\right)}$$

其中：

- $f(t, d)$：词 $t$ 在文档 $d$ 中的词频
- $|d|$：文档长度（词数）
- $\text{avgdl}$：语料库平均文档长度
- $k_1$：词频饱和参数（通常 1.2~2.0）
- $b$：长度归一化参数（通常 0.75）
- $\text{IDF}(t) = \ln\left(\frac{N - n(t) + 0.5}{n(t) + 0.5} + 1\right)$

### 1.3 相比 TF-IDF 的两大改进

1. **词频饱和**：TF-IDF 中词频线性增长，BM25 让词频增长趋于平缓，避免一个词重复出现就 dominate 分数。
2. **文档长度归一化**：长文档天然更容易命中词，BM25 通过 $b$ 参数对长文档做惩罚，更公平。

### 1.4 适用与局限

- **适用**：传统关键词检索、全文搜索、RAG 的稀疏检索 baseline、与稠密向量做 hybrid search。
- **局限**：纯词项匹配，不理解语义（「汽车」查不到「轿车」），所以现在常和稠密向量检索互补。

## 2. BM25 已经是关键词搜索了，为什么还要向量？

一句话：**BM25 是「字面匹配」，稠密向量是「语义匹配」，两者解决的问题根本不同，需要互补。**

### 2.1 BM25 的本质局限：只认字，不认意思

| 查询 | 文档里写的 | BM25 能命中吗 | 原因 |
|------|-----------|--------------|------|
| 汽车价格 | 轿车报价 | ❌ | 没有公共词项 |
| 如何退款 | 退货流程 | ❌ | 同义但字面不同 |
| 数据库 | database | ❌ | 中英文 |
| ResNet | ResNet | ✅ | 字面一致 |
| errcode 500 | errcode 500 | ✅ | 精确词项 |

只要用户用的词和文档里的词不是同一串字符，BM25 就抓瞎。

### 2.2 反过来，向量也有 BM25 擅长的地方

1. **精确专有名词 / 代码 / 编号**：ResNet-50、CVE-2021-44228、errcode ECONNREFUSED——embedding 容易混到近似但不准的结果。
2. **低频词、罕见术语**：embedding 对训练语料里没见过的词编码不准。
3. **可解释性**：BM25 命中就是因为含某个词，可审计。

### 2.3 错误方向不同，所以 1+1 > 2

- BM25 的错误：**语义相关但字面不同 → 漏召回**（false negative）
- 向量的错误：**字面相似但语义无关 → 误召回**（false positive）

两类的错误方向不同，融合后各自补对方的盲区。这就是 RRF / 加权融合能在绝大多数 IR benchmark 上同时提升 recall 和 precision 的原因。

### 2.4 什么时候只用一个

- **只用 BM25**：法律条文、编号检索、代码符号、严格关键词过滤。
- **只用向量**：问答语义检索、自然语言找相似描述、跨语言。
- **两者都要**：通用文档搜索、RAG、客服知识库——绝大多数真实场景。

## 3. 单纯 BM25 怎么用

三种方式，从轻到重：

### 3.1 Python 库 rank_bm25（小规模 / 实验）

```python
from rank_bm25 import BM25Okapi
import jieba

corpus = [
    "Milvus 是一个向量数据库",
    "Elasticsearch 支持全文检索",
    "向量数据库可以存储 embedding",
    "BM25 是经典的关键词打分算法",
]
tokenized_corpus = [list(jieba.cut(doc)) for doc in corpus]

bm25 = BM25Okapi(tokenized_corpus)             # 建索引
tokenized_query = list(jieba.cut("向量数据库"))
scores = bm25.get_scores(tokenized_query)      # 打分

top_k = sorted(zip(corpus, scores), key=lambda x: -x[1])[:3]
for doc, score in top_k:
    print(f"{score:.4f}\t{doc}")
```

`rank_bm25` 提供三个变体：`BM25Okapi`（最常用）、`BM25L`（对长文档友好）、`BM25Plus`（改进 IDF）。

> **注意**：纯 Python、全量计算，适合几千到几万篇文档，上百万扛不住。

### 3.2 Elasticsearch / OpenSearch（生产级）

ES 的默认打分就是 BM25，建索引直接搜：

```python
es.indices.create(index="docs", mappings={
    "properties": {"content": {"type": "text", "analyzer": "ik_max_word"}}
})
for doc in corpus:
    es.index(index="docs", document={"content": doc})
res = es.search(index="docs", query={"match": {"content": "向量数据库"}}, size=3)
```

### 3.3 在 Milvus 里只用 BM25（不混合稠密）

只建稀疏字段、不建稠密字段：

```python
schema.add_field("text", DataType.VARCHAR, max_length=8192)
schema.add_field("sparse", DataType.SPARSE_FLOAT_VECTOR)
schema.add_function(Function(name="bm25", function_type=FunctionType.BM25,
                             input_field_names=["text"], output_field_names=["sparse"]))
```

### 3.4 怎么选

| 场景 | 推荐 |
|------|------|
| 原型、几百~几万文档、本地脚本 | rank_bm25 |
| 生产、需要分词/高亮/过滤/运维成熟 | Elasticsearch |
| 已在用 Milvus、想统一存储检索 | Milvus 内置 BM25 |
| 数据量大 + 要和向量混合 | Milvus / ES |

## 4. Milvus 里 BM25 + 语义怎么做（混合检索）

### 4.1 整体架构

```
        用户 query (文本)
            │
      ┌─────┴─────┐
      │           │
  原样送 BM25   embedding 模型 → 稠密向量
      │           │
  稀疏检索       稠密检索
 (SPARSE)      (HNSW/COSINE)
      │           │
      └─────┬─────┘
        RRF / 加权融合
            │
        最终 Top-K
```

### 4.2 完整代码

```python
from pymilvus import (MilvusClient, DataType, Function, FunctionType,
                      AnnSearchRequest, RRFRanker)
from sentence_transformers import SentenceTransformer

client = MilvusClient("http://localhost:19530")
emb_model = SentenceTransformer("BAAI/bge-small-zh-v1.5")
DIM = 384
COLLECTION = "hybrid_demo"

# 1. schema：text + sparse + dense
schema = MilvusClient.create_schema(auto_id=True, enable_dynamic_field=False)
schema.add_field("id", DataType.INT64, is_primary=True)
schema.add_field("text", DataType.VARCHAR, max_length=4096,
                 enable_analyzer=True, analyzer_params={"type": "chinese"})
schema.add_field("sparse", DataType.SPARSE_FLOAT_VECTOR)
schema.add_field("dense", DataType.FLOAT_VECTOR, dim=DIM)

# 2. BM25 函数：text -> sparse（写入时只给 text，自动算稀疏）
schema.add_function(Function(
    name="bm25", function_type=FunctionType.BM25,
    input_field_names=["text"], output_field_names=["sparse"],
))

# 3. 索引
index_params = client.prepare_index_params()
index_params.add_index(field_name="sparse", index_type="SPARSE_INVERTED_INDEX",
                       metric_type="IP", params={"drop_ratio_build": 0.2})
index_params.add_index(field_name="dense", index_type="HNSW",
                       metric_type="COSINE", params={"M": 16, "efConstruction": 200})
client.create_collection(COLLECTION, schema=schema, index_params=index_params)

# 4. 插入（只给 text + dense）
docs = ["Milvus 是开源向量数据库", "轿车报价多少"]
rows = [{"text": d, "dense": emb_model.encode(d).tolist()} for d in docs]
client.insert(COLLECTION, rows)

# 5. 混合检索
query = "汽车价格"
sparse_req = AnnSearchRequest(data=[query], anns_field="sparse",
                              param={"metric_type": "IP"}, limit=20)
dense_req = AnnSearchRequest(data=[emb_model.encode(query).tolist()],
                             anns_field="dense",
                             param={"metric_type": "COSINE"}, limit=20)
results = client.hybrid_search(COLLECTION, reqs=[sparse_req, dense_req],
                               ranker=RRFRanker(k=60), limit=5,
                               output_fields=["text"])
```

### 4.3 关键决策点

**为什么稀疏用 IP，稠密用 COSINE？**

- BM25 稀疏向量本质是「词项→权重」，分数就是点积（内积）→ IP。
- 稠密向量比较方向，归一化消除长度 → COSINE。
- 两者量纲不同（BM25 几十，cosine 0~1），**不能直接相加原始分数**，这就是 ranker 存在的原因。

**RRF vs WeightedRanker：**

| Ranker | 原理 | 何时用 |
|--------|------|--------|
| RRFRanker(k=60) | 只看排名，分数 1/(k+rank) 求和 | 默认首选，无需调参 |
| WeightedRanker(0.7, 0.3) | 分数加权求和（需归一化） | 清楚哪路更重要 |

**经验**：没把握用 RRF；有标注集再上 WeightedRanker 网格搜索。

## 5. BM25 怎么「算出」稀疏向量？（核心洞察）

这是最关键的概念点。**BM25 不是 embedding——它没有神经网络、没有学习。它做的只是「把文本里每个词，按统计公式算一个权重，塞到这个词对应的维度上」。**

### 5.1 一个完整算例

3 篇文档：`doc1="向量 数据库 检索"`、`doc2="向量 数据库 存储"`、`doc3="数据库 检索 算法"`。

**建词表（term → 维度 id）：**

| 词项 | dim_id |
|------|--------|
| 向量 | 0 |
| 数据库 | 1 |
| 检索 | 2 |
| 存储 | 3 |
| 算法 | 4 |

**算统计量**：N=3，avgdl=3；df：向量=2、数据库=3、检索=2、存储=1、算法=1。

**算 IDF**（k1=1.2, b=0.75）：

- 向量 IDF ≈ 0.47
- 数据库 IDF ≈ 0.134
- 存储 IDF ≈ 0.847（越稀有 IDF 越大）

**算 doc2 各词权重** → 组装稀疏向量：

```
doc2 稀疏向量 = {0: 0.47, 1: 0.134, 3: 0.847}   # 其它维度为 0，省略
```

### 5.2 查询打分 = 内积

query="向量 检索" → 稀疏向量 `{0:w, 2:w}`，对 doc1 做内积：

```
score(query, doc1) = w_q(向量)×w_doc1(向量) + w_q(检索)×w_doc1(检索)
```

**BM25 打分 = query 稀疏向量 · 文档稀疏向量的内积**——这就是为什么 Milvus 稀疏检索用 `metric_type="IP"`。

### 5.3 和 embedding 的本质区别

| | BM25 稀疏向量 | Embedding 稠密向量 |
|---|---|---|
| 怎么生成 | 统计公式 | 神经网络前向 |
| 维度含义 | 一个具体词项（可解释） | 学到的抽象特征（不可解释） |
| 维度数 | 词表大小（几十万~百万），极稀疏 | 固定（384/768），全稠密 |
| 是否学习 | 否，确定性 | 是 |
| 同义能力 | 无 | 有 |

> **心智模型**：Embedding 是神经网络把语义**编码**进稠密向量；BM25 是统计公式把词项**登记**进稀疏向量。两者都叫「向量」，但一个是模型产出、一个是公式产出。Milvus 用「稀疏向量」这个统一抽象表示 BM25，是为了让稀疏检索和稠密检索共用同一套字段/索引/检索接口。

## 6. 稀疏向量的维度是多少？跟稠密一致吗？

**不一致，差别很大。**

| 维度 | 稠密向量 | 稀疏向量 |
|------|---------|---------|
| 维度长度 | 固定（如 768），建表指定 dim | 不固定 = 词表大小，建表**不指定 dim** |
| 单条非零值数 | 全部（768 个） | 几十~几百（命中词数） |
| 维度含义 | 学到的抽象特征 | 一个具体词项 |
| 维度来源 | embedding 模型 | 语料的词（动态词表） |
| 维度可变吗 | 否 | 是，随新词增长 |
| 存储 | 定长 dense | 只存非零项 |

关键点：

- Milvus 稀疏字段 schema 里**没有 dim 参数**。
- 稀疏维度 = 整个 collection 词表大小，词表是动态生成的。
- **稀疏存储**：只存非零项 `{dim_id: weight}`，不存几百万个 0。所以词表巨大但单条占用反而小。
- 稀疏和稠密是两套**平行的向量空间**，hybrid search 靠排名层融合，不需要维度对齐。

## 7. 词表是什么？怎么维护？

### 7.1 三个概念分清

| 概念 | 是什么 | 谁产生 |
|------|--------|--------|
| 词项 (term) | 分词后的单个词 | 分词器 analyzer |
| **词表 (vocabulary)** | 所有不同词项集合 + term→id 映射 | **索引引擎（Milvus/ES）** |
| BM25 权重 | 每个词在每篇文档的分数 | BM25 公式 |

> **词表不是 BM25 产生的，是分词器 + 索引引擎维护的；BM25 只是词表的消费者。** 把 BM25 换成 SPLADE，词表概念依然存在；换分词器，词表完全变了。

### 7.2 词表长什么样

```
┌──────────┬────────┬─────────┐
│ term     │ dim_id │ df      │
├──────────┼────────┼─────────┤
│ 向量      │ 0      │ 2       │
│ 数据库    │ 1      │ 3       │
│ 检索      │ 2      │ 2       │
└──────────┴────────┴─────────┘
```

### 7.3 维护机制：segment 级增量

- **Growing segment**：写入时分词，遇新词分配新 dim_id，统计量内存累加。
- **Sealed segment**：seal 时词表固化进倒排索引字典。
- **Compaction**：多段合并，词表合并、统计量重算。
- **只增不减**：删文档不回收 dim_id（避免全局 id 重排），要彻底收缩只能重建 collection。

### 7.4 词表和分词器强绑定

同一句「向量数据库」，不同分词器产出不同词表：

```
jieba:         ["向量", "数据库"]
IK ik_smart:   ["向量数据库"]
IK ik_max_word:["向量","数据库","数据","据库"]
standard:      ["向","量","数","据","库"]
```

含义：

1. **分词器一旦确定不能随便换**，换了必须重建索引。
2. **新词问题**：词典里没有的词切不出来，词表没正确 term，BM25 查不到——要靠自定义词典（IK 支持热更新）。
3. **同义词**不在词表管，是查询时扩展，和词表维护是两回事。

## 8. 倒排索引详解

### 8.1 为什么需要倒排索引

**正排**（文档→词）查「检索」在哪些文档，要遍历所有文档，O(N×文档长度)。
**倒排**（词→文档）直接取 `检索 → [doc1, doc3]`，O(命中文档数)，和总文档数无关。

### 8.2 完整结构

**字典（Term Dictionary）**：term → 指向 posting list 的指针。实现方式：排序数组二分 / 哈希表 / **FST**（Lucene 用，前缀共享压缩，几百万词压到很小内存）。

**倒排表（Posting List）**：每个词项对应的文档列表，带 doc_id、tf、positions、payload/权重。

> Milvus 稀疏语境下，posting list 存的就是 `(doc_id, BM25 权重)`，查询时直接做内积，不再现场算 tf/长度归一。

### 8.3 查询流程

```
query="向量 检索"
  ① 查字典 → 取两个 posting list
  ② 归并候选集 {doc1, doc2, doc3}
  ③ 对每个候选算 BM25 分数（取 posting list 里的 tf/权重）
  ④ 排序取 Top-K
```

**效率核心**：只碰了「向量」「检索」两个 posting list，没扫全量文档。复杂度 ≈ O(两个 posting list 长度之和)，和语料规模几乎无关——这就是百万文档毫秒级返回的原因。

### 8.4 核心优化技术

1. **doc id 重映射 + 差值编码**：存差值 `[3,14,28,...]` 而非绝对值，小数字更好压缩。
2. **压缩编码**：VByte/Varint、**PFor Delta**（Lucene 大量用），压缩到 1/4~1/8。省磁盘更省内存带宽。
3. **Skip List 跳表**：长 posting list 做交集时跨段跳过，高频词尤其关键。
4. **分块 + 按需加载**：positions 占空间大，只在短语查询时加载。

### 8.5 倒排 vs 稠密图索引（HNSW）

| | 倒排（稀疏/BM25） | HNSW（稠密） |
|---|---|---|
| 数据结构 | 词→文档列表 | 邻接图 |
| 精确性 | 精确 | 近似（ANN） |
| 擅长 | 词项精确匹配 | 语义相似 |

### 8.6 Milvus 稀疏倒排索引的特殊之处

1. 字典 key 是 dim id 而非字符串。
2. posting list 存权重而非 tf（BM25 已算好）。
3. `drop_ratio_build` 剪枝：建索引时丢每篇文档权重最低的比例，压缩+加速。
4. 统一进向量检索抽象，对外接口和稠密一致，内部却是不同引擎。

## 9. 分词：BM25 效果的天花板

### 9.1 分词是什么

把连续文本切成词项（term/token）。计算机不懂「词」，检索要按词匹配，就必须先切。**难点在中文**（无空格、有歧义）。

经典歧义：「南京市长江大桥」→ 正确「南京市/长江大桥」vs 错误「南京/市长/江大桥」。

### 9.2 Analyzer 三层结构

```
原始文本
  ① Character Filter（去 HTML、正则清洗）
  ② Tokenizer（切词 —— 决定切法）
  ③ Token Filter（大小写、停用词、同义词、词干化）
最终词项流
```

调试神器：`POST /_analyze { "analyzer": "ik_max_word", "text": "..." }`

### 9.3 中文分词器对比

| 分词器 | 特点 | 用在哪 |
|--------|------|--------|
| jieba | 词典+HMM，轻量快 | Python、Milvus 内置中文 analyzer |
| IK | ES 插件最流行，双模式、热更新词典 | Elasticsearch |
| Smartcn | ES 自带，不如 IK 灵活 | Elasticsearch |
| HanLP | 最准最重 | 高精度场景 |

**IK 两种模式（最实用配置）：**

- `ik_max_word`：切到最细，**索引端用**（召回全）。
- `ik_smart`：最粗切分，**查询端用**（精度高）。

**索引细 + 查询粗**是经典搭配：索引覆盖所有组合保证 recall，查询切成最完整词项避免噪声。

### 9.4 英文分词要点

- 词干化（stemming）：running→run、cars→car、databases→database。英文提升召回的关键。
- 停用词、大小写归一、asciifolding（café→cafe）。
- `english` analyzer 内置这套组合。

### 9.5 分词对检索的影响

| query | 文档 | 分词器 | 命中 | 原因 |
|------|------|--------|------|------|
| 汽车价格 | 轿车报价 | 任何 | ❌ | 词项不重叠，分词救不了 |
| 向量数据库 | 向量数据库 | standard(逐字) | 差 | 单字命中噪声大 |
| 向量数据库 | 向量数据库 | ik_smart | ✅精准 | 整词命中 |
| databases | database | 无词干化 | ❌ | 复数没归一 |
| ChatGPT | ChatGPT 很强 | jieba 无新词词典 | ❌/差 | 切成 Chat/GPT |

### 9.6 核心原则

1. 索引端和查询端必须**同族**分词器。
2. 上线后**不能随便换**，换则重建。
3. 中文优先上专门分词器，别用 standard 逐字。
4. 新词多准备**自定义词典**，最好支持热更新。
5. **分词质量是 BM25 的天花板**——分词切错，BM25/倒排再优化也没用。

## 10. rank_bm25 是「打分器」不是「检索引擎」

### 10.1 BM25Okapi(tokenized_corpus) 干什么

用分好词的语料**构建 BM25 索引**：扫一遍语料，算出每个词的 df/IDF、每篇文档的长度/词频、avgdl，全部缓存进对象。之后 `get_scores(query)` 直接复用这些统计量打分。

对应关系：

| rank_bm25 | Milvus/ES 对应 |
|-----------|---------------|
| tokenized_corpus | 分词器产出的词项流 |
| BM25Okapi(...) 构造 | 建 SPARSE_INVERTED_INDEX |
| 对象内部统计量 | 词表统计 + 倒排表 tf/权重 |
| get_scores(query) | search(anns_field="sparse") |

### 10.2 get_scores 返回什么

返回一个 **numpy 分数数组**，长度 = 语料文档数，`scores[i]` = 第 i 篇文档的分数。**下标 = 文档在 corpus 里的位置序号，不带业务 doc id，不排序，未命中是 0。**

要拿 (id, 分数, 排序) 得自己 `zip + sort`，或用 `get_top_n` 直接拿 top-K 文档。

### 10.3 只做了检索流程的一件事

```
query ──① 定位候选 ──② 打分 ──③ 排序取 Top-K
        (倒排索引)    (BM25)    (sort+截断)
```

rank_bm25 **只做 ②**，而且对全语料每篇都打分：

- ❌ 没倒排索引，不定位候选
- ✅ 有 BM25 公式
- ❌ 不排序截断

复杂度 O(全语料)，不管 query 命中几个词。**这正是它简单但低效、进不了生产的根源。**

### 10.4 生产里加文档只能全量重建

```python
# rank_bm25 没有 bm25.add(new_docs)
tokenized_corpus += new_docs
bm25 = BM25Okapi(tokenized_corpus)   # 全量重建！
```

因为统计量是语料级的，加一篇新文档，所有词的 df/IDF/avgdl 都可能变，没法局部更新。所以 rank_bm25 定位是：**离线批处理、静态语料、几千~几万文档、实验原型。**

## 11. Milvus 的 add：原生增量

### 11.1 add 就是 insert / upsert

```python
client.insert("hybrid_docs", [
    {"text": "新文档1", "dense": emb_model.encode("新文档1").tolist()},
])
# sparse 字段由 BM25 Function 自动算，不用手动给
```

### 11.2 内部怎么走

```
insert(新文档)
  → 写入 growing segment（内存增量，只追加）
     · BM25 Function 自动分词+算权重→生成 sparse
     · 新词分配新 dim_id，统计量内存累加
  → growing 段暴力可查（近实时可见）
  → seal：固化成 sealed segment，建稀疏+稠密索引
  → 后台 compaction：合并小段，统计量重算
```

**老索引全程不重建，写入不阻塞查询。**

### 11.3 对比

| | rank_bm25 | Milvus |
|---|---|---|
| 加新文档 API | ❌ | ✅ insert/upsert |
| 代价 | 全量重建 O(全语料) | 追加 O(新文档量) |
| 老索引动不动 | 动（重建） | 不动 |
| 写入阻塞查询 | 阻塞 | 不阻塞 |
| 统计量更新 | 重建时一把算 | segment 增量 + compaction |

### 11.4 IDF 漂移

增量写入带来 BM25 固有问题：新文档改变 df/avgdl，老查询分数会变。不是 bug，是 BM25 设计如此。

- 冷启动先灌主数据再开放查询。
- 大数据量稳定后影响趋于 0。
- 别用固定分数阈值，用相对排名。

## 12. ES 里的 BM25 和分词器

### 12.1 BM25 参数可调

```json
"similarity": {"default": {"type": "BM25", "k1": 1.2, "b": 0.75}}
```

| 参数 | 默认 | 作用 | 怎么调 |
|------|------|------|--------|
| k1 | 1.2 | 词频饱和速度 | 想强调频次→调大；短文本→调小 |
| b | 0.75 | 长度归一化强度 | 长短混杂→保持；长度均匀→调小 |

默认 (1.2, 0.75) 是公认好起点，有标注集再网格搜索。

### 12.2 分词器生态

ES 中文主流用 **IK**：支持 `ik_max_word`/`ik_smart` 双模式、自定义词典、**热更新词典**（新词不用重启）。这是 ES 相对 Milvus 在纯 BM25 全文检索上的最大优势。

### 12.3 ES vs Milvus BM25 对比

| 维度 | Elasticsearch | Milvus |
|------|--------------|--------|
| 分词器 | 极成熟（IK/Smartcn/同义词/词干化） | 内置中文，可定制性弱 |
| BM25 参数 | k1/b 可调，可按字段 | 不暴露 |
| 混合检索 | 需外部接向量+自己融合 | 原生 hybrid_search + RRF |
| 全文检索能力 | 高亮/phrase/slop/fuzzy 齐全 | 仅基础 BM25 |
| 适合 | 纯关键词/成熟全文检索 | 向量为主、BM25 辅助的混合 |

**一句话**：纯 BM25 + 复杂全文检索 → ES；BM25 和向量同系统融合 → Milvus。两者 BM25 数学上一样，差别在分词器生态和工程集成度。

## 13. 总结：核心心智模型

### 13.1 职责划分

```
文本 ─①分词器──> 词项 ─②引擎──> 词表+倒排索引 ─③BM25──> 权重 ─④检索──> Top-K
       analyzer             Milvus/ES           打分公式
```

- **分词** = analyzer 的活
- **词表/倒排索引** = 引擎的活
- **打分** = BM25 的活（只是消费者，不管前两步）

### 13.2 五个最容易记混的点

1. **BM25 不管分词、不管建索引、不管维护词表**——它只是个打分公式。
2. **rank_bm25 是打分器不是检索引擎**：没倒排索引、没增量、加文档要全量重建，只适合实验。
3. **Milvus/ES 是完整引擎**：分词 + 倒排索引 + 增量 segment + 打分，insert 时 BM25 Function 自动算稀疏向量。
4. **稀疏维度 = 词表大小（不固定、只增不减），稠密维度 = 模型定死**，两者不一致也不需要对齐，靠 hybrid 在排名层融合。
5. **分词是 BM25 的天花板**——分词切错，后面全白搭。

### 13.3 选型一句话

- 离线/实验/小数据 → rank_bm25
- 生产纯 BM25 全文检索 → Elasticsearch
- 生产 BM25 + 向量混合 → Milvus
- 超大规模极致性能 → Lucene 直接调 / 自研

### 13.4 稀疏 vs 稠密一句话

- **Embedding**：神经网络把语义**编码**进稠密向量（黑盒、连续、语义）。
- **BM25**：统计公式把词项**登记**进稀疏向量（透明、离散、词法）。
- **Hybrid**：两套平行向量空间，在排名层（RRF/加权）融合，互补盲区。

---

> **最后**：BM25 是 1994 年的算法，三十年了还是全文检索的标配。不是因为它是银弹，而是它把「词法精确匹配」这件事做到了简单、可解释、够用。现代检索的趋势不是抛弃它，而是把它和稠密向量放一起做 hybrid——精确词项 + 语义同义，两手都要硬。理解了这条链路（分词→词表→倒排索引→BM25→稀疏向量→hybrid），你也就理解了现代 RAG 检索的地基。
