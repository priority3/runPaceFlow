# RunPaceFlow

个人运动数据可视化展示端，活动数据由 RunPaceFlow Admin 统一接入和管理。

[English](../README.md)

## 功能

- 只读展示活动数据库中已有的跑步和骑行记录
- 地图路线可视化与动画回放
- 分段配速分析与图表展示
- AI 跑步分析（Claude / OpenAI 兼容 API，支持自动降级）
- 地图组件懒加载，优化包体积与加载性能
- 从 RunPaceFlow Admin 读取运行时配置
- 响应式设计，适配桌面与移动端

## 数据边界

RunPaceFlow 不再直接接入或同步运动数据。数据接入、第三方平台凭据、PR Agent 工作流和运行时配置都由 RunPaceFlow Admin 管理；本应用只读取共享活动库并负责展示训练体验。

## 配置

创建 `.env.local` 文件：

```bash
# 读取 RunPaceFlow Admin 运行时配置时必填
RUNPACEFLOW_ADMIN_URL=http://localhost:3030
CONFIG_EXPORT_TOKEN=your_export_token

# 可选：直接数据库兜底
DATABASE_URL=file:./data/activities.db
DATABASE_AUTH_TOKEN=

# 可选：地图样式
NEXT_PUBLIC_MAP_STYLE=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json

# Claude AI 配置（可选 - 主要 AI 分析服务）
ANTHROPIC_API_KEY=your_api_key
ANTHROPIC_BASE_URL=  # 可选：自定义 API 地址（用于代理）

# OpenAI 兼容 API 配置（可选 - 备用 AI 分析服务）
# 支持 OpenAI、DeepSeek、通义千问等 OpenAI 兼容的 API
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=  # 第三方服务必填（如 https://api.deepseek.com）
OPENAI_MODEL=  # 可选，默认 gpt-4o
OPENAI_API_FORMAT=  # 可选：chat（默认）或 responses

# 运动目标配置（可选 - 自定义周/月目标）
NEXT_PUBLIC_WEEKLY_DISTANCE_GOAL=10000
NEXT_PUBLIC_MONTHLY_DISTANCE_GOAL=50000
NEXT_PUBLIC_WEEKLY_DURATION_GOAL=3600
NEXT_PUBLIC_MONTHLY_DURATION_GOAL=18000
```

### AI 分析配置（可选）

AI 功能可为每次运动生成个性化分析，包括配速分析、分段表现和训练建议。支持多 provider 自动降级：

- **Claude**（主要）需要 `ANTHROPIC_API_KEY`
- **OpenAI 兼容 API**（备用）需要 `OPENAI_API_KEY`，支持 OpenAI、DeepSeek、通义千问等

当 Claude 调用失败或不可用时，系统自动切换到 OpenAI 兼容 API。

> 注意：未配置任何 AI provider 时，应用正常运行，但不会显示 AI 分析。

## 本地开发

```bash
# 安装依赖
bun install

# 使用本地 SQLite 时执行数据库迁移
bun run db:migrate

# 启动开发服务器
bun run dev
```

访问 http://localhost:3000

## 部署

在部署平台配置同样的环境变量。生产环境建议将 `RUNPACEFLOW_ADMIN_URL` 和 `CONFIG_EXPORT_TOKEN` 指向 admin 实例，也可以直接提供 `DATABASE_URL` / `DATABASE_AUTH_TOKEN`。

## Credits

灵感来源：[yihong0618/running_page](https://github.com/yihong0618/running_page)

## License

MIT
