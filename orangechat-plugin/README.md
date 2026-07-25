# 绯界 OrangeChat 插件

这个目录可直接打包为 OrangeChat（橘瓣）插件。

## 文件

```text
orangechat-plugin/
├── manifest.json
├── main.js
└── ui/
    └── index.html
```

## 安装

1. 将 `orangechat-plugin` 目录中的全部文件压缩为 ZIP。
2. 在 OrangeChat 中导入该 ZIP。
3. 打开插件设置，可选择填写：
   - 绯界数据接口
   - AI 读取钥匙
   - AI 回复钥匙
4. 点击页面底部的“保存配置”。

钥匙也可以不预先保存在插件设置中，而由绯界“发送给 AI”生成的任务单在每次调用时传入。

## AI 工具

### `read_crimson_record`

按 `record_id` 精确读取一条记录。工具不会用相似结果替代目标记录。

### `write_crimson_reply`

把完整最终回复追加写入同一条记录的 `note` 字段。接口本身会阻止回复钥匙修改原始记录或创建新记录。

### `search_crimson_records`

用于排查记录是否已经同步，或在没有准确 ID 时搜索。正式续写流程应优先使用精确读取工具。

## 推荐任务流程

```text
用户发送绯界任务单
→ AI 调用 read_crimson_record
→ AI 结合角色卡、世界书、近期记忆完成内容
→ AI 调用 write_crimson_reply
→ 网站收取或同步 AI 回复
```

## 当前接口

默认接口：

```text
https://crimson-tavern.boarder-72pound.chatgpt.site/api/vault
```

插件同时发送 `Authorization: Bearer ...` 和 `X-Tavern-Key`，以兼容当前接口与 OrangeChat 的网络运行环境。

## 安全边界

- 读取钥匙只能读取和搜索。
- 回复钥匙只能向已有记录的 `note` 追加内容。
- 插件不会创建记录，不会覆盖原始正文，也不会修改其他记录。
- 单次写回最多 8000 字，与当前服务端限制一致。
