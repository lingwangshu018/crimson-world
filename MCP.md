# 绯界 MCP

绯界通过统一的远程 MCP 服务，向支持 MCP 的 AI 客户端开放记录读取、搜索、提示词生成和回复写回能力，不再维护橘瓣专用插件。

## MCP 地址

部署后使用：

```text
https://你的绯界后端域名/api/mcp
```

当前目标地址：

```text
https://crimson-tavern.boarder-72pound.chatgpt.site/api/mcp
```

传输方式：Streamable HTTP。

协议版本：优先 `2025-11-25`，同时兼容 `2025-06-18` 与 `2025-03-26`。

## MCP 能力

### Tools

- `read_crimson_record`：按准确 `record_id` 和读取钥匙读取一条记录。
- `search_crimson_records`：按关键词搜索记录，用于找记录或排查同步状态。
- `write_crimson_reply`：把完整最终回复追加写入同一条记录的 `note` 字段。

`write_crimson_reply` 单次最多写回 12000 字。

### Resources

- `crimson://server/guide`：标准读取、续写与写回流程。
- `crimson://server/security`：三把钥匙的权限划分和安全边界。

支持：

- `resources/list`
- `resources/read`
- `resources/templates/list`

### Prompts

- `continue_crimson_record`

参数：

- `record_id`
- `read_key`
- `reply_key`

该提示词会生成一条完整任务消息，引导 AI 先读取记录，再结合角色卡、世界书和近期记忆完成内容，最后写回同一条记录。

支持：

- `prompts/list`
- `prompts/get`
- `completion/complete`

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

- 主人钥匙只由绯界网页用于同步，MCP 不接收主人钥匙。
- 读取钥匙只能读取与搜索。
- 回复钥匙只能向已有记录追加回复。
- `write_crimson_reply` 不创建新记录。
- 原始 `content` 不会被回复工具修改。
- 服务端按记录 ID 精确匹配，避免误写其他记录。
- 重复写入相同回复时，统一记录层会避免重复追加。
- MCP 会校验浏览器请求的 `Origin`，拒绝未授权来源。

## 客户端配置示例

支持远程 Streamable HTTP MCP 的客户端通常只需要填写：

```json
{
  "mcpServers": {
    "crimson-world": {
      "url": "https://crimson-tavern.boarder-72pound.chatgpt.site/api/mcp"
    }
  }
}
```

不同客户端的字段名称可能不同，但核心地址均为 `/api/mcp`。读取钥匙和回复钥匙不需要永久保存到 MCP 配置中，AI 调用工具时直接使用任务单里的钥匙。

## 协议行为

- `POST /api/mcp`：接收 JSON-RPC 请求与通知。
- `GET /api/mcp`：当前服务器不提供独立 SSE 监听流，因此返回 `405 Method Not Allowed`。
- `DELETE /api/mcp`：无状态服务器没有会话需要销毁，返回 `204 No Content`。
- `OPTIONS /api/mcp`：处理跨域预检。

支持的主要 JSON-RPC 方法：

```text
initialize
ping
tools/list
tools/call
resources/list
resources/read
resources/templates/list
prompts/list
prompts/get
completion/complete
notifications/initialized
notifications/cancelled
notifications/progress
```

## 初始化验证

部署后可以发送：

```bash
curl -X POST "https://crimson-tavern.boarder-72pound.chatgpt.site/api/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-11-25",
      "capabilities": {},
      "clientInfo": {
        "name": "crimson-test",
        "version": "1.0.0"
      }
    }
  }'
```

随后运行项目检查：

```bash
npm run typecheck:pages
npm run build:cloudflare
```
