# 绯界 MCP

绯界现在通过一个统一的 MCP 服务向支持 MCP 的 AI 客户端开放记录读取与回复写回能力，不再需要维护橘瓣专用插件。

## MCP 地址

部署后使用：

```text
https://你的绯界后端域名/api/mcp
```

当前后端部署完成后预计为：

```text
https://crimson-tavern.boarder-72pound.chatgpt.site/api/mcp
```

传输方式：Streamable HTTP。

## 工具

### `read_crimson_record`

按准确的 `record_id` 读取一条记录。

参数：

- `record_id`：时光之轮任务单中的记录 ID
- `read_key`：任务单中的读取钥匙

### `search_crimson_records`

按关键词搜索记录，主要用于寻找记录或排查同步状态。

参数：

- `query`：记录编号、标题、关键词或记录 ID 片段
- `read_key`：任务单中的读取钥匙
- `module`：可选，限定模块
- `limit`：可选，1～50，默认 10

### `write_crimson_reply`

把完整最终回复追加写入同一条记录的 `note` 字段。

参数：

- `record_id`：必须与读取时完全相同
- `reply_key`：任务单中的回复钥匙
- `content`：完整最终回复，最多 12000 字

## 推荐流程

```text
用户在时光之轮点击“发送给 AI”
→ 绯界先把当前记录同步到 /api/records
→ 用户把生成的任务单发送给 AI
→ AI 调用 read_crimson_record
→ AI 结合当前聊天中的角色卡、世界书和近期记忆完成内容
→ AI 调用 write_crimson_reply
→ 完整回复写回同一记录的 note 字段
```

## 安全边界

- 读取钥匙只能读取与搜索。
- 回复钥匙只能向已有记录追加回复。
- MCP 不接收主人钥匙，也不能同步或覆盖整份档案。
- `write_crimson_reply` 不创建新记录。
- 原始 `content` 不会被回复工具修改。
- 服务端会检查返回记录 ID，避免误写其他记录。
- 重复写入相同回复时，统一记录层会避免重复追加。

## 客户端配置示例

支持远程 Streamable HTTP MCP 的客户端通常只需要填写服务地址：

```json
{
  "mcpServers": {
    "crimson-world": {
      "url": "https://crimson-tavern.boarder-72pound.chatgpt.site/api/mcp"
    }
  }
}
```

不同客户端的配置界面和字段名称可能不同，但核心地址均为 `/api/mcp`。读取钥匙和回复钥匙不需要永久写入 MCP 配置，AI 调用工具时直接使用时光之轮任务单中的钥匙即可。

## 部署验证

合并并重新部署后，可先访问：

```text
GET /api/mcp
```

应返回服务名称、协议版本和三个工具名称。

随后应运行项目检查：

```bash
npm run typecheck:pages
npm run build:cloudflare
```
