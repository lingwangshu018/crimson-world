# 绯界 · Crimson World

一个面向 AI 角色扮演与世界叙事的模块化创作空间。

绯界把角色卡、世界书、事件记录、AI 续写、云端存档与回信写回放进同一个世界中。用户可以在不同房间创建故事记录，再通过统一的读取钥匙与回复钥匙，让支持 MCP 的 AI 精确读取指定记录并把完整回复写回原处。

## 在线访问

- [Cloudflare 正式入口](https://crimson-world.lingwangshu018.workers.dev)
- [GitHub 仓库](https://github.com/lingwangshu018/crimson-world)

默认服务接口：

```text
MCP：https://crimson-world.lingwangshu018.workers.dev/api/mcp
统一记录：https://crimson-world.lingwangshu018.workers.dev/api/records
云端档案：https://crimson-world.lingwangshu018.workers.dev/api/vault
```

> 浏览器中的本地记录以 `localStorage` 为主。只有主动执行同步后，AI 才能通过云端接口读取到最新版本。

## 世界模块

| 模块 | 用途 |
| --- | --- |
| 绯夜酒馆 | 组合成人向虚构标签，生成酒签，并保存与续写“随杯手记” |
| 绯界咖啡馆 | 创建日常、陪伴、恋爱与自定义小剧场订单 |
| 我们的日记 | 写日记、分类收藏，并让 AI 依据正文写回信 |
| 时光之轮 | 创建自定义事件模板，运行事件并收取 AI 续写 |
| 旅行小兔 | 由当前启用角色作为旅行者，给用户寄回旅行信 |
| 皇家图书馆 | 管理角色卡、公共世界书与角色专属世界书 |
| 编纂室 | 新建、编辑、分类、启用、导入和导出角色卡与世界书 |
| 自习室 | 专注计时与学习记录 |
| 绯界控制中心 | 管理本地备份、Cloudflare 云端、三把钥匙、AI 回复与 Git 存档 |

## 皇家图书馆与自动上下文

皇家图书馆用于保存绯界中的角色卡和世界书。

创建或同步事件时，绯界会把当时匹配到的角色卡、世界书、关键词命中结果与版本快照保存到记录的 `metadata.royalLibraryContext` 中。AI 读取记录后，可以直接依据这份绑定上下文创作，不需要把完整角色卡和世界书再次复制进任务单。

目前已接入：

- 绯夜酒馆
- 绯界咖啡馆
- 我们的日记
- 时光之轮
- 旅行小兔

## MCP

绯界提供基于 HTTP 的 MCP 服务：

```text
https://crimson-world.lingwangshu018.workers.dev/api/mcp
```

将这个地址添加到支持远程 HTTP MCP 的 AI 客户端后，AI 可以使用以下工具：

| MCP 工具 | 权限与作用 |
| --- | --- |
| `read_crimson_record` | 使用准确的记录 ID 与读取钥匙，读取一条指定记录 |
| `search_crimson_records` | 使用读取钥匙按关键词或模块搜索记录 |
| `write_crimson_reply` | 使用回复钥匙，把完整最终回复写回已有记录的 `note` 字段 |

标准流程：

```text
在绯界创建记录
→ 点击“发送给 AI”并完成同步
→ 将复制出的任务单发给 AI
→ AI 调用 read_crimson_record 精确读取
→ AI 依据记录及 metadata.royalLibraryContext 完成创作
→ AI 调用 write_crimson_reply 写回同一个记录 ID
→ 回到绯界收取 AI 回复
```

写回工具只能更新已有记录的回复字段，不会创建新记录，也不会覆盖原始事件正文。单次写回上限为 12,000 字。

> 不同客户端对工具名称的展示可能不同；以 MCP 服务返回的工具列表为准。

## 三把钥匙

绯界使用三把彼此独立的随机钥匙：

| 钥匙 | 用途 |
| --- | --- |
| 主人钥匙 | 建立、覆盖与恢复自己的完整云端档案；请勿公开 |
| 读取钥匙 | 只允许 AI 读取和搜索已同步记录 |
| 回复钥匙 | 只允许 AI 向已有记录写入回复，不能修改原始正文或删除记录 |

钥匙在当前浏览器中生成并保存。服务端只保存用于校验的摘要，不保存可直接复制使用的明文钥匙。

重新生成钥匙后，必须执行一次“全部同步”，云端接口才会切换到新钥匙。换设备、清理浏览器数据或更换浏览器前，请先导出完整备份，并妥善保存三把钥匙。

## 数据、云端与备份

### 本地数据

各模块首先保存到当前浏览器的 `localStorage`。不同浏览器、设备和网站来源之间不会自动共享本地数据。

### Cloudflare 云端

绯界默认通过 Cloudflare Worker 与 D1 提供：

- 统一记录同步
- MCP 读取与搜索
- AI 回复写回
- 完整档案保存与恢复
- 三把钥匙的限权校验

只有已经同步的记录才能被外部 AI 读取。修改本地内容后，如需让 AI 看到最新版本，请重新同步。

### JSON 备份

控制中心支持完整 JSON 导出与导入，可用于：

- 换设备
- 清理浏览器前备份
- 手动迁移
- 云端故障时恢复

### Git 仓库存档

控制中心另设独立的 Git 存档区，支持配置：

- Gitee
- GitHub
- GitLab
- 其他 Git 服务

当前版本支持把绯界本地数据导出为 JSON，再手动上传到私有仓库；也可以从仓库下载后导回绯界。远程自动提交尚未实现。

Git 存档不会包含：

- 主人钥匙
- 读取钥匙
- 回复钥匙
- Git 访问令牌

详细说明见 [`git-archive/README.md`](git-archive/README.md)。建议始终使用私有仓库。

## 本地开发

需要 Node.js `>=22.13.0`。

```bash
npm ci
npm run dev
```

构建静态版本：

```bash
npm run build:pages
```

构建与部署 Cloudflare：

```bash
npm run build:cloudflare
npm run deploy:cloudflare
```

常用检查：

```bash
npm run typecheck:pages
npm run lint
npm test
```

## 技术结构

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Vite 8
- Vinext
- Cloudflare Workers
- Cloudflare D1
- HTTP MCP
- GitHub Pages 静态构建兼容

主要目录：

```text
app/
  api/mcp/route.ts          # MCP 服务
  api/records/route.ts      # 统一记录读取与回复写回
  api/vault/route.ts        # 完整云端档案
  CloudCellar.tsx           # 绯界控制中心
  JournalRoom.tsx           # 日记
  CafeRoom.tsx              # 咖啡馆
  TravelRabbitRoom.tsx      # 旅行小兔
  royal-library-context.ts  # 角色卡与世界书上下文

github-pages/               # 静态构建入口与皇家图书馆编纂室
git-archive/                # Git 仓库存档规范、示例与实现
scripts/                    # UI 补丁、构建与回归检查
```

## 内容边界

绯界整体是通用的 AI 叙事与角色扮演工具；其中“绯夜酒馆”包含成人向虚构标签。

- 成人向内容仅限年满 18 周岁的用户
- 成人向场景中的所有参与者必须是明确成年的虚构人物
- 不得用于现实人物、未成年人或动物
- 当前酒馆版本不包含 GORE 维度
- 请以自愿、知情、安全以及所在地法律与所用 AI 平台规则为前提
- 用户自行创建和导入的角色卡、世界书及记录由用户自行负责

## 来源、许可与署名

> **Based on [Ruota della Fortuna by Copper (29-Cu)](https://github.com/29-Cu/routa-della-fortuna).**

“绯夜酒馆”的标签维度分类、部分标签数据以及随机组合机制参考并改编自上述项目；其中原项目的标签分类体系与命名工作亦署名 **Monday**。

绯界在此基础上重新设计并实现了酒馆式交互、世界地图、多房间叙事、调酒历史、随杯手记、角色称呼、皇家图书馆、记录绑定上下文、Cloudflare 云端、MCP 读取写回、完整备份与 Git 仓库存档。

本项目为独立改编项目，与原作者不存在官方合作、隶属或背书关系。依据原项目许可证要求，上述署名应同时保留在本 README 以及绯夜酒馆的公开页面或界面中。完整声明见本仓库的 [LICENSE](LICENSE)。

### 原项目贡献署名

- **Copper (29-Cu)** — 原项目概念、视觉设计、标签整理与前端实现
- **Monday** — 原项目标签分类体系、分类设计与命名

## License

见 [LICENSE](LICENSE)。
