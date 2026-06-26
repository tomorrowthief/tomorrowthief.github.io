---
title: "【AI代写】Milvus 混合检索实战：BM25 + 语义向量从 0 到 1"
date: 2026-06-26T20:00:00+08:00
draft: false
categories: '技术'
tags: ['Milvus', '混合检索', 'Hybrid Search', 'RAG', 'BM25']
---

> 上一篇《BM25 学习总结》讲了原理，这篇讲实战：用 Milvus 从零搭一个「BM25 稀疏 + 语义稠密」混合检索系统，含建库、写入、三种检索对比、重排、标量过滤、调参和踩坑记录。代码可直接跑。

## 0. 这篇要解决什么问题

纯向量检索语义强但漏精确词，纯 BM25 精确但漏同义表达。混合检索（hybrid search）把两路结果在排名层融合，互补盲区，是工业界 RAG 检索的标准配方。

Milvus 2.5+ 把 BM25 做成内置 Function，能在**同一个 collection、同一次查询**里融合稀疏和稠密，不用再外接 ES。这篇就用 Milvus 把这条路完整跑通。

## 1. 环境准备

```bash
# 1. 启动 Milvus（standalone，docker）
# 参考 https://milvus.io/docs/install_standalone-docker.md
docker compose up -d

# 2. 装依赖
pip install "pymilvus>=2.5" sentence-transformers
```

```python
from pymilvus import (MilvusClient, DataType, Function, FunctionType,
                      AnnSearchRequest, RRFRanker, WeightedRanker)
from sentence_transformers import SentenceTransformer

client = MilvusClient("http://localhost:19530")
emb = SentenceTransformer("BAAI/bge-small-zh-v1.5")  # 中文语义，384 维
DIM = 384
COLLECTION = "hybrid_practice"
```

> 版本说明：BM25 Function、`analyzer_params={"type":"chinese"}`、`SPARSE_INVERTED_INDEX` 需要 **Milvus 2.5+**（2.6 更稳）。pymilvus 跟随 Milvus 版本。

## 2. 数据准备

造一个小但能说明问题的语料——故意混入「同义不同字」和「精确专有名词」两类样本，好对比三种检索的差异。

```python
docs = [
    {"id": i, "text": t, "category": c}
    for i, (t, c) in enumerate([
        ("Milvus 是开源的向量数据库，支持稀疏和稠密混合检索",   "db"),
        ("Elasticsearch 用 BM25 做默认全文检索打分",            "search"),
        ("向量数据库可以高效存储和检索 embedding",              "db"),
        ("轿车报价多少，最新款汽车价格一览",                     "car"),
        ("混合检索结合稀疏 BM25 和稠密语义向量的优势",          "search"),
        ("ResNet-50 在 ImageNet 上的图像分类精度",              "ml"),
        ("errcode ECONNREFUSED 表示网络连接被拒绝",             "ops"),
        ("汽车价格查询，新车报价对比平台",                       "car"),
    ])
]
```

注意两条关键样本：
- query「汽车价格」→ 文档 3/7 是「轿车报价」「汽车价格」，**纯 BM25 命中 7 漏 3，纯向量都能命中但 7 更准**。
- query「ResNet-50」→ 文档 6 含精确词项，**纯向量可能被「ResNet」「网络错误」干扰，BM25 精准命中**。

这两类正是 hybrid 互补的典型场景。

## 3. 设计 Collection Schema

一个 collection 同时挂稀疏 + 稠密 + 标量字段：

```python
schema = MilvusClient.create_schema(auto_id=False, enable_dynamic_field=False)

schema.add_field("id", DataType.INT64, is_primary=True)
schema.add_field("text", DataType.VARCHAR, max_length=4096,
                 enable_analyzer=True,               # 开启分词
                 analyzer_params={"type": "chinese"})  # 中文分词(jieba-based)
schema.add_field("category", DataType.VARCHAR, max_length=32)  # 标量，用于过滤
schema.add_field("sparse", DataType.SPARSE_FLOAT_VECTOR)       # BM25 自动填充
schema.add_field("dense", DataType.FLOAT_VECTOR, dim=DIM)      # 语义向量

# BM25 函数：text -> sparse（写入时只给 text，Milvus 自动算稀疏向量）
schema.add_function(Function(
    name="bm25",
    function_type=FunctionType.BM25,
    input_field_names=["text"],
    output_field_names=["sparse"],
))
```

几个设计要点：

1. **`auto_id=False`**：用业务 id 做主键，方便 upsert 和排查。
2. **`enable_dynamic_field=False`**：结构固定，避免动态字段带来意外。
3. **`analyzer_params={"type":"chinese"}`**：稀疏检索效果的天花板由分词决定，中文必须用中文分词器，不能用默认 standard（会逐字切）。
4. **标量字段 `category`**：混合检索经常要配元数据过滤（比如只在 db 类里查），预留好。
5. **sparse 字段不用指定 `dim`**：稀疏维度 = 词表大小，动态增长，和稠密的 `dim=384` 是两套空间。

## 4. 建索引

稀疏走倒排，稠密走图索引，各建各的：

```python
index_params = client.prepare_index_params()

index_params.add_index(
    field_name="sparse",
    index_type="SPARSE_INVERTED_INDEX",   # 稀疏倒排索引
    metric_type="IP",                     # BM25 分数 = 内积
    params={"drop_ratio_build": 0.2},     # 建索引时丢每篇文档权重最低 20% 词项
)
index_params.add_index(
    field_name="dense",
    index_type="HNSW",
    metric_type="COSINE",
    params={"M": 16, "efConstruction": 200},
)

client.create_collection(COLLECTION, schema=schema, index_params=index_params)
```

- **sparse 用 `IP`**：BM25 稀疏打分本质是 query 稀疏向量 · doc 稀疏向量的内积。
- **dense 用 `COSINE`**：语义向量比较方向，归一化消除长度影响。
- **量纲不同**（BM25 几十、cosine 0~1），**所以不能直接把两路原始分数相加**——这是后面必须用 ranker 融合的原因。
- **`drop_ratio_build`**：剪掉低权重词项，压缩索引 + 加速，代价是漏一点长尾召回。小语料建议调小（0.1）或不剪。

## 5. 写入数据

只给 `text`、`dense`、标量；`sparse` 由 BM25 Function 自动算：

```python
rows = [{
    "id": d["id"],
    "text": d["text"],
    "category": d["category"],
    "dense": emb.encode(d["text"]).tolist(),
} for d in docs]
client.insert(COLLECTION, rows)

# 落盘 + 建索引（小数据可立刻 load）
client.flush(COLLECTION)
client.load_collection(COLLECTION)
```

写入后 BM25 Function 在后台做了：分词 → 词映射到 dim_id → 用段级统计算 BM25 权重 → 组装稀疏向量存进 `sparse` 字段。你不用手动算稀疏向量，这是 Milvus 相对 rank_bm25 的核心便利。

> 增量：之后随时 `client.insert(...)` 加新文档，不用重建索引，老索引不动，写入不阻塞查询（segment 增量模型）。

## 6. 三种检索对比

这是实战的核心——用同一个 query 跑三种方式，直观看差异。

```python
def show(results, tag):
    print(f"\n=== {tag} ===")
    for r in results[0]:
        print(f"  id={r['id']}  dist={r.get('distance',0):.4f}  {r['entity']['text']}")
```

### 6.1 纯 BM25（稀疏）

```python
q = "汽车价格"
res = client.search(
    COLLECTION, data=[q], anns_field="sparse",
    param={"metric_type": "IP"}, limit=5,
    output_fields=["text"],
)
show(res, "pure BM25")
```

行为：query 文本走 BM25 Function 转稀疏向量，在倒排索引里取 posting list 算内积。**「汽车价格」字面命中文档 7（汽车价格查询）**，但「轿车报价」的文档 3 一个词都不重叠，几乎召回不到。

### 6.2 纯语义（稠密）

```python
res = client.search(
    COLLECTION, data=[emb.encode(q).tolist()], anns_field="dense",
    param={"metric_type": "COSINE", "params": {"ef": 64}}, limit=5,
    output_fields=["text"],
)
show(res, "pure dense")
```

行为：query 转成 embedding，在 HNSW 图上游走找近邻。**「轿车报价」的文档 3 因为语义相近能被召回**，但也可能把「ResNet-50」「errcode」这类带「网络/连接」语义的文档拉进来干扰。

### 6.3 混合检索（RRF 融合）

```python
sparse_req = AnnSearchRequest(
    data=[q], anns_field="sparse",
    param={"metric_type": "IP"}, limit=20,
)
dense_req = AnnSearchRequest(
    data=[emb.encode(q).tolist()], anns_field="dense",
    param={"metric_type": "COSINE", "params": {"ef": 64}}, limit=20,
)

res = client.hybrid_search(
    COLLECTION,
    reqs=[sparse_req, dense_req],
    ranker=RRFRanker(k=60),     # 按排名融合，量纲无关
    limit=5,
    output_fields=["text"],
)
show(res, "hybrid (RRF)")
```

行为：两路各自检索 Top-20，RRF 按 $1/(k+\text{rank})$ 把排名融合成统一分数，取 Top-5。**结果同时包含「汽车价格」（BM25 强）和「轿车报价」（语义强）**，互补明显。

## 7. 加重排：再提一截精度

hybrid 的 Top-K 是召回层，**再用 cross-encoder 精排**能让精度再上一个台阶，RAG 场景强烈建议加。

```python
from sentence_transformers import CrossEncoder
reranker = CrossEncoder("BAAI/bge-reranker-v2-m3")

def hybrid_rerank(q, limit=20, final_k=5):
    sparse_req = AnnSearchRequest(data=[q], anns_field="sparse",
                                  param={"metric_type": "IP"}, limit=limit)
    dense_req = AnnSearchRequest(data=[emb.encode(q).tolist()], anns_field="dense",
                                 param={"metric_type": "COSINE",
                                        "params": {"ef": 64}}, limit=limit)
    res = client.hybrid_search(COLLECTION, reqs=[sparse_req, dense_req],
                               ranker=RRFRanker(k=60), limit=limit,
                               output_fields=["text"])
    cands = [(r["id"], r["entity"]["text"]) for r in res[0]]
    # cross-encoder 对 (query, doc) 逐对比对
    pairs = [(q, t) for _, t in cands]
    scores = reranker.predict(pairs)
    ranked = sorted(zip(cands, scores), key=lambda x: -x[1])[:final_k]
    return [(cid, s, t) for (cid, t), s in ranked]

for cid, s, t in hybrid_rerank("汽车价格"):
    print(f"  rerank={s:.4f}  id={cid}  {t}")
```

为什么有效：召回阶段的 embedding 是**双塔**（query 和 doc 各自编码再比距离），交叉信号弱；cross-encoder 是**交互式**（query 和 doc 拼一起过模型），能捕捉词级匹配关系，精度更高但慢——所以只对 Top-20 重排，不对全库跑。

## 8. 标量过滤：在混合检索上加元数据约束

实战里几乎一定要带过滤（只搜某分类、某时间段、某租户）。hybrid_search 支持 `filter`：

```python
sparse_req = AnnSearchRequest(
    data=[q], anns_field="sparse",
    param={"metric_type": "IP"}, limit=20,
    expr='category == "car"',   # 标量过滤，写法同 search
)
dense_req = AnnSearchRequest(
    data=[emb.encode(q).tolist()], anns_field="dense",
    param={"metric_type": "COSINE", "params": {"ef": 64}}, limit=20,
    expr='category == "car"',
)
res = client.hybrid_search(COLLECTION, reqs=[sparse_req, dense_req],
                           ranker=RRFRanker(k=60), limit=5,
                           output_fields=["text", "category"])
```

注意 `expr` 要写在每个 `AnnSearchRequest` 上，且两路过滤条件通常保持一致，否则融合的两路候选集口径不同。

> 过滤时机：Milvus 默认是「先过滤再 ANN」（metadata filtering），能显著缩小候选集。建标量字段索引（如 `INVERTED`）能让过滤更快。

## 9. 调参指南

实战调参集中在几个旋钮上：

| 参数 | 在哪 | 怎么调 |
|------|------|--------|
| RRF `k` | `RRFRanker(k=60)` | k 越大，头部排名优势越平。默认 60 通用；想让 Top-1 更"硬"调小（如 20） |
| WeightedRanker 权重 | `WeightedRanker(0.5,0.5)` | 有标注集时网格搜索；偏关键词场景 `(0.7,0.3)`，偏语义 `(0.3,0.7)` |
| 每路 `limit` | `AnnSearchRequest(limit=20)` | 至少是最终 limit 的 2~4 倍，给融合留候选池 |
| `drop_ratio_build` | sparse 索引 params | 小语料 0.1 或不剪；大语料 0.2 省空间 |
| `drop_ratio_search` | sparse 查询 params | query 短，建议 0~0.1，剪多了漏召回 |
| HNSW `ef` | dense 查询 params | 召回越高 ef 越大，但越慢；64 起步 |
| BM25 分词器 | 字段 analyzer | 效果天花板；中文换更好分词器或加自定义词典 |

**调参顺序建议**：先把 RRF k 和每路 limit 调到 recall 够 → 再试 WeightedRanker 看能否再提 → 最后上 reranker。别一上来就堆 reranker，先保证召回层没漏。

## 10. 常见踩坑

1. **分词器选错**：中文用默认 standard 会逐字切，BM25 噪声大、词表爆炸。必须 `{"type":"chinese"}` 或自定义。
2. **query 和 doc 用不同 embedding 模型**：dense 字段写入和查询必须**同一模型**，否则语义空间不一致，稠密检索全废。
3. **两路 limit 太小**：hybrid_search 每路只取 5，融合后等于没融合。每路 limit ≥ 最终 limit 的 2~4 倍。
4. **用 WeightedRanker 直接加原始分数**：BM25 几十、cosine 0~1，直接加权会让 BM25 永远 dominate。要么用 RRF（量纲无关），要么先把分数归一化。
5. **冷启动分数不稳**：数据少时 IDF 随写入波动，先灌主数据再开放查询。
6. **忘了 load_collection**：建完不 load 查询会报错或走暴力扫。
7. **过滤条件两路不一致**：sparse 带过滤、dense 不带，融合的两路候选集口径不同，结果不可比。
8. **改分词器没重建**：分词器一换词表全变，必须重建 collection（reindex）。

## 11. 完整可跑代码（合并版）

```python
from pymilvus import (MilvusClient, DataType, Function, FunctionType,
                      AnnSearchRequest, RRFRanker)
from sentence_transformers import SentenceTransformer, CrossEncoder

client = MilvusClient("http://localhost:19530")
emb = SentenceTransformer("BAAI/bge-small-zh-v1.5")
reranker = CrossEncoder("BAAI/bge-reranker-v2-m3")
DIM, COLLECTION = 384, "hybrid_practice"

# schema
schema = MilvusClient.create_schema(auto_id=False, enable_dynamic_field=False)
schema.add_field("id", DataType.INT64, is_primary=True)
schema.add_field("text", DataType.VARCHAR, max_length=4096,
                 enable_analyzer=True, analyzer_params={"type": "chinese"})
schema.add_field("category", DataType.VARCHAR, max_length=32)
schema.add_field("sparse", DataType.SPARSE_FLOAT_VECTOR)
schema.add_field("dense", DataType.FLOAT_VECTOR, dim=DIM)
schema.add_function(Function(name="bm25", function_type=FunctionType.BM25,
                             input_field_names=["text"], output_field_names=["sparse"]))

# index
ip = client.prepare_index_params()
ip.add_index(field_name="sparse", index_type="SPARSE_INVERTED_INDEX",
             metric_type="IP", params={"drop_ratio_build": 0.2})
ip.add_index(field_name="dense", index_type="HNSW",
             metric_type="COSINE", params={"M": 16, "efConstruction": 200})
client.create_collection(COLLECTION, schema=schema, index_params=ip)

# data
docs = [("Milvus 是开源向量数据库，支持混合检索","db"),
        ("轿车报价多少，最新款汽车价格一览","car"),
        ("汽车价格查询，新车报价对比平台","car"),
        ("ResNet-50 在 ImageNet 图像分类精度","ml"),
        ("errcode ECONNREFUSED 网络连接被拒绝","ops")]
rows = [{"id":i,"text":t,"category":c,"dense":emb.encode(t).tolist()}
        for i,(t,c) in enumerate(docs)]
client.insert(COLLECTION, rows)
client.load_collection(COLLECTION)

# hybrid + rerank
def search(q, k=5):
    s = AnnSearchRequest(data=[q], anns_field="sparse",
                         param={"metric_type":"IP"}, limit=20)
    d = AnnSearchRequest(data=[emb.encode(q).tolist()], anns_field="dense",
                         param={"metric_type":"COSINE","params":{"ef":64}}, limit=20)
    r = client.hybrid_search(COLLECTION, reqs=[s,d], ranker=RRFRanker(60),
                             limit=k*4, output_fields=["text"])[0]
    pairs=[(q,x["entity"]["text"]) for x in r]
    sc=reranker.predict(pairs)
    return sorted(zip(r,sc), key=lambda x:-x[1])[:k]

for hit, s in search("汽车价格"):
    print(f"{s:.4f}  id={hit['id']}  {hit['entity']['text']}")
```

## 12. 小结

- **混合检索 = 召回层（BM25 稀疏 + 语义稠密，RRF 融合）+ 可选重排层（cross-encoder）**，这是现代 RAG 检索的标准结构。
- Milvus 把 BM25 做成 Function，稀疏和稠密在**同一 collection、同一次 hybrid_search** 里融合，省去外接 ES 的运维成本。
- 效果天花板由**分词器**决定，精度上限由**重排**拉升，召回完整性由**每路 limit + RRF 调参**保证。
- 实战顺序：分词选对 → 召回层调到 recall 够 → 上 reranker 提精度 → 加标量过滤控范围。

> 上一篇讲清了「为什么」，这篇跑通了「怎么做」。两篇合起来，从 BM25 公式到可上线的混合检索系统，链路就完整了。下一步可以接 LLM 做 RAG：hybrid Top-K → reranker Top-3 → 拼 prompt → 生成回答。
