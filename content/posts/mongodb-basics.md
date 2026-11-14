---
title: "MongoDB 入门：核心概念、适用场景与 CRUD 常规操作"
date: 2026-11-14T10:00:00+08:00
description: "从 PostgreSQL 的表与行出发，理解 MongoDB 的集合、BSON 文档和嵌套字段，通过站点管理示例练习查询、新增、更新、删除、分页与索引。"
categories: '技术'
tags: ['MongoDB', '数据库', 'NoSQL', 'CRUD']
draft: false
---

最近维护一个站点管理系统，需要查出“哪些站点开启了公网访问”。习惯 SQL 后，第一反应是找表和列，实际代码却是 `db.sites.find({ "publicAccess.enabled": true })`。从这条查询出发，可以把 MongoDB 的概念和常用操作串起来。

本文使用 **mongosh** 语法，示例均针对独立练习库 `mongodb_learning`。Compass 的 Filter 输入框只填写筛选对象；应用代码应使用相应语言的 MongoDB 驱动。文章依据文末官方文档整理，示例未连接生产数据库执行。

## 1. 从表和行认识集合与文档

| 关系数据库概念 | MongoDB 概念 | 理解方式 |
| --- | --- | --- |
| Database | Database | 数据库 |
| Table | Collection | 存放一类业务对象 |
| Row | Document | 一条业务记录 |
| Column | Field | 记录中的属性 |
| Primary key | `_id` | 集合内唯一标识 |
| Index | Index | 为查询建立访问路径 |

这是一组概念类比，不表示二者的建模方法完全一致。MongoDB 使用 **BSON 文档**，即可以表达嵌套对象、数组以及日期、ObjectId 等类型的二进制文档格式。它看起来像 JSON，但不等于普通 JSON 文本。

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  siteId: "site-001",
  title: "团队知识库",
  publicAccess: { enabled: true },
  tags: ["internal", "docs"],
  visits: 12,
  createdAt: ISODate("2026-11-14T01:00:00Z")
}
```

`publicAccess` 是嵌入文档，`tags` 是数组。查询嵌套属性时使用带引号的点路径 `"publicAccess.enabled"`。不要把整个对象相等查询与子字段查询混为一谈：匹配整个嵌入文档会受字段内容及顺序等因素影响。

MongoDB 通常自动为新文档生成 ObjectId 类型的 `_id`，也可以由应用指定。业务编号 `siteId` 不会自动唯一，需要另建唯一索引。字符串 `"507f..."` 与 `ObjectId("507f...")` 是不同类型，查询时不能随意互换。

同一集合的文档可以有不同字段，但结构灵活不等于无需设计。字段名称、类型和必填规则仍应在应用中统一，必要时配置 schema validation。单个 BSON 文档有 16 MiB 大小限制，无限增长的日志或评论不适合一直嵌入一个文档。

## 2. 什么场景适合 MongoDB

选型时先看数据如何被读取和更新，再决定怎么存。

- **属性差异较大的对象**：商品目录、站点配置、内容管理等，各对象共享部分字段，也有自己的扩展属性。
- **经常整体读取的业务对象**：一份站点配置连同少量标签一起返回，文档模型可以直接表达这种结构。
- **地理空间数据**：GeoJSON 配合空间索引，可表达点、线、面并进行邻近或区域查询。

如果系统依赖大量跨实体关联、复杂报表、严格的外键约束，或成熟的关系模型已经很适合业务，PostgreSQL/MySQL 往往更直接。MongoDB 支持聚合、`$lookup` 和多文档事务，但这些能力并不意味着可以忽略关联成本与事务开销。

也不要简单记成“MongoDB 比关系数据库快”。访问模式、数据规模、索引和部署方式才决定实际性能。

### 嵌入还是引用

站点的公网开关和少量标签，可以嵌入站点文档；不断增长的访问日志，应独立为集合，通过 `siteId` 关联。共享且独立变化的用户信息，也可以使用引用。

原则是：一起访问、规模有界、需要一起更新的数据适合嵌入；独立生命周期、共享或无界增长的数据更适合拆开。

## 3. 准备一组练习数据

连接到自己的练习实例后，在 mongosh 执行：

```javascript
use mongodb_learning

db.getName()
show collections

// 仅在首次练习时插入；重复执行会产生重复的业务编号。
db.sites.insertMany([
  {
    siteId: "site-001", title: "团队知识库", owner: "alice",
    publicAccess: { enabled: true }, tags: ["docs", "internal"],
    visits: 12, createdAt: ISODate("2026-11-14T01:00:00Z")
  },
  {
    siteId: "site-002", title: "活动页面", owner: "bob",
    publicAccess: { enabled: false }, tags: ["event"],
    visits: 3, createdAt: ISODate("2026-11-14T02:00:00Z")
  },
  {
    siteId: "site-003", title: "历史站点", owner: "alice",
    tags: [], visits: 0,
    createdAt: ISODate("2026-11-14T03:00:00Z")
  }
])
```

`use` 切换数据库，并不会仅凭这一句就持久化创建数据库。首次写入数据时，数据库及不存在的集合可以被创建。

## 4. Create：新增

```javascript
db.sites.insertOne({
  siteId: "site-004",
  title: "产品手册",
  owner: "carol",
  publicAccess: { enabled: false },
  tags: ["docs"],
  visits: 0,
  createdAt: new Date()
})
```

`insertOne()` 返回 `insertedId` 等信息，`insertMany()` 用于批量插入。批量操作不天然等于一个整体事务；默认有序插入遇到错误后，前面成功的文档不会自动回滚。

## 5. Read：查询

### 条件、投影和嵌套字段

```javascript
// 类似 SELECT * FROM sites WHERE site_id = 'site-001'
db.sites.findOne({ siteId: "site-001" })

// 查询开启公网的站点，只返回需要的字段
db.sites.find(
  { "publicAccess.enabled": true },
  { _id: 0, siteId: 1, title: 1, owner: 1 }
)
```

`findOne()` 返回一个文档或 `null`；`find()` 返回游标。投影里的 `1` 表示包含，`0` 表示排除。除 `_id` 的特殊处理外，通常不能在同一投影中混用包含与排除。

### 比较与逻辑运算

```javascript
// 同一筛选对象中的多个条件默认是 AND
db.sites.find({ owner: "alice", visits: { $gte: 10 } })

// 大于、小于等比较也有 $gt / $lt / $lte / $ne
db.sites.find({ siteId: { $in: ["site-001", "site-002"] } })

// OR
db.sites.find({
  $or: [{ owner: "bob" }, { "publicAccess.enabled": true }]
})

// 日期范围：左闭右开
db.sites.find({
  createdAt: {
    $gte: ISODate("2026-11-14T00:00:00Z"),
    $lt: ISODate("2026-11-15T00:00:00Z")
  }
})
```

日期按明确时区构造；不要把字符串日期与 BSON Date 混用。

### 缺失字段、null 与 false

```javascript
// 只匹配显式 false；不匹配缺失字段
db.sites.find({ "publicAccess.enabled": false })

// 业务规定“缺失也算关闭”时，明确表达这个规则
db.sites.find({
  $or: [
    { "publicAccess.enabled": false },
    { "publicAccess.enabled": { $exists: false } }
  ]
})
```

`{ field: null }` 会匹配值为 null 或字段不存在的文档。`{ field: { $ne: true } }` 也会包含缺失以及其他不等于 true 的值，不能在数据类型不受约束时直接解释为“关闭”。

### 数组

```javascript
// 数组包含 docs
db.sites.find({ tags: "docs" })

// 同时包含两个标签
db.sites.find({ tags: { $all: ["docs", "internal"] } })
```

若数组元素是文档，且要求多个条件命中同一个元素，应使用 `$elemMatch`，避免不同元素分别满足条件。

### 排序、分页与数量

```javascript
db.sites.find({})
  .sort({ createdAt: -1, _id: -1 })
  .skip(0)
  .limit(20)

db.sites.countDocuments({ "publicAccess.enabled": true })
```

`-1` 为降序，`1` 为升序。加入唯一的 `_id` 作为排序补充，能避免时间相同时顺序不确定。深分页的 `skip` 成本会增长；数据量大时应按排序键及 `_id` 设计游标分页。

## 6. Update：更新

### 修改字段：$set、$unset、$inc

```javascript
db.sites.updateOne(
  { siteId: "site-002" },
  {
    $set: { "publicAccess.enabled": true, updatedAt: new Date() },
    $inc: { visits: 1 }
  }
)

// 删除一个字段，保留文档
db.sites.updateOne(
  { siteId: "site-002" },
  { $unset: { obsoleteField: "" } }
)
```

`$set: { "publicAccess.enabled": true }` 修改子字段；`$set: { publicAccess: { enabled: true } }` 会替换整个 `publicAccess` 对象，其中其他属性可能丢失。

检查返回的 `matchedCount` 和 `modifiedCount`：匹配到文档但值没有变化时，修改数可以是 0。

### 数组修改与批量更新

```javascript
// 添加标签，并避免重复
db.sites.updateOne(
  { siteId: "site-002" }, { $addToSet: { tags: "public" } }
)

// 删除匹配的数组元素
db.sites.updateOne(
  { siteId: "site-002" }, { $pull: { tags: "public" } }
)

// 更新全部匹配文档
db.sites.updateMany(
  { owner: "alice" }, { $set: { updatedAt: new Date() } }
)
```

`$push` 追加数组元素且允许重复；`$addToSet` 不会清理数组里已经存在的重复值。

### 不存在则插入：upsert

```javascript
db.sites.updateOne(
  { siteId: "site-005" },
  {
    $set: { title: "新站点", updatedAt: new Date() },
    $setOnInsert: {
      owner: "alice", visits: 0, tags: [],
      publicAccess: { enabled: false }, createdAt: new Date()
    }
  },
  { upsert: true }
)
```

匹配时更新，不匹配时插入；`$setOnInsert` 只在插入时生效。并发 upsert 应配合业务编号的唯一索引，避免重复业务对象。

`replaceOne()` 用于整体替换文档，不是局部更新；新内容未包含的旧字段会被移除，`_id` 不可更改。

### 并发更新：把预期状态放进条件

```javascript
db.sites.updateOne(
  { siteId: "site-001", "publicAccess.enabled": true },
  { $set: { "publicAccess.enabled": false, updatedAt: new Date() } }
)
```

只有当前仍为开启状态时才修改。应用需要检查匹配数，并定义“未找到”和“状态已变化”的处理方式。单文档写入具有原子性，但 `updateMany()` 对所有匹配文档的修改并不是整体原子事务。

## 7. Delete：删除

先用相同条件查询确认范围，再执行删除：

```javascript
db.sites.find({ siteId: "site-004" })
db.sites.deleteOne({ siteId: "site-004" })

// 批量删除示例：仅练习库中使用，先查看命中记录
db.sites.find({ siteId: { $in: ["site-003", "site-005"] } })
db.sites.deleteMany({ siteId: { $in: ["site-003", "site-005"] } })
```

检查 `deletedCount`。`deleteMany({})` 会删除集合内所有文档；`drop()` 则删除集合及其索引，二者含义不同。

## 8. 索引：让常用查询有合适的访问路径

```javascript
// 执行前先确认历史数据没有重复的 siteId
db.sites.createIndex({ siteId: 1 }, { unique: true })

// 对应：按 owner 筛选，再按时间和 _id 降序读取
db.sites.createIndex({ owner: 1, createdAt: -1, _id: -1 })

db.sites.getIndexes()

db.sites.find({ owner: "alice" })
  .sort({ createdAt: -1, _id: -1 })
  .limit(20)
  .explain("executionStats")
```

关注执行计划、`nReturned`、`totalDocsExamined` 和 `totalKeysExamined`，判断扫描量是否合理。小数据集选择集合扫描不一定有问题，也不能只凭出现索引扫描就认定性能足够好。

索引占空间，也增加写入维护成本。布尔字段取值少，单独给公网开关建索引未必有收益，应结合筛选比例、排序和实际查询计划决定。

## 9. 常用操作速查

| 目的 | 方法或运算符 |
| --- | --- |
| 新增单条 / 多条 | `insertOne` / `insertMany` |
| 查询单条 / 多条 | `findOne` / `find` |
| 统计匹配数 | `countDocuments` |
| 修改单条 / 多条 | `updateOne` / `updateMany` |
| 修改 / 移除字段 | `$set` / `$unset` |
| 数值累加 | `$inc` |
| 数组追加 / 去重追加 / 移除 | `$push` / `$addToSet` / `$pull` |
| 不存在则插入 | `{ upsert: true }` |
| 删除单条 / 多条 | `deleteOne` / `deleteMany` |
| 建索引 / 看索引 | `createIndex` / `getIndexes` |
| 检查查询计划 | `explain("executionStats")` |

练习时可以依次完成：插入站点、查询公网开启项、修改开关、追加标签、按时间分页、查看执行计划，最后按业务编号删除练习记录。掌握这些操作后，再学习聚合管道、schema validation、副本集和事务。

## 参考资料

- [MongoDB 官方：CRUD 操作](https://www.mongodb.com/docs/manual/crud/)
- [MongoDB 官方：数据建模](https://www.mongodb.com/docs/manual/data-modeling/)
- [MongoDB 官方：BSON 类型](https://www.mongodb.com/docs/manual/reference/bson-types/)
- [MongoDB 官方：查询 null 与缺失字段](https://www.mongodb.com/docs/manual/tutorial/query-for-null-fields/)
- [MongoDB 官方：索引](https://www.mongodb.com/docs/manual/indexes/)
- [MongoDB 官方：原子性与事务](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/)
- [MongoDB 官方：地理空间查询](https://www.mongodb.com/docs/manual/geospatial-queries/)
