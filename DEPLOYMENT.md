# 部署指南

## 架构

- RunPaceFlow Admin 负责运动数据同步、第三方凭据、AI 洞察生成和 `shared.db`。
- RunPaceFlow 主站是只读展示端，通过 `RUNPACEFLOW_ADMIN_URL` 调用 Admin 的主站 API。
- Turso 只在 Admin 侧作为 `shared.db` 的镜像/备份目标，主站不持有 Turso 地址或 Token。

## 主站配置

在 Vercel 或其他主站部署平台配置：

```bash
RUNPACEFLOW_ADMIN_URL=https://admin.example.com
RUNPACEFLOW_ADMIN_API_TOKEN=<与 Admin MAIN_SITE_API_TOKEN 相同的随机值>
```

不要在主站配置 `DATABASE_URL`、`DATABASE_AUTH_TOKEN`、`ACTIVITIES_DATABASE_URL` 或同步/AI 凭据。

## Admin 配置

在 Admin 部署环境配置：

```bash
MAIN_SITE_API_TOKEN=<与主站 RUNPACEFLOW_ADMIN_API_TOKEN 相同的随机值>
ACTIVITIES_DATABASE_URL=file:/app/shared/shared.db
DATABASE_URL=libsql://<turso 数据库>.turso.io
DATABASE_AUTH_TOKEN=<turso 镜像 Token>
```

`ACTIVITIES_DATABASE_URL` 必须指向与同步任务和 pr-agent 共享的 `shared.db`。`DATABASE_URL` 和 `DATABASE_AUTH_TOKEN` 只供 Admin 的镜像任务使用。

## 本地启动

先启动 Admin，再启动主站：

```bash
# runPaceFlow-admin
MAIN_SITE_API_TOKEN=local-main-site-token bun run dev

# runPaceFlow
RUNPACEFLOW_ADMIN_URL=http://127.0.0.1:3030 \
RUNPACEFLOW_ADMIN_API_TOKEN=local-main-site-token \
bun run dev
```

如果主站显示空状态，先检查 Admin 的 `data/shared.db` 是否真的包含 `activities` 记录；空数据库是数据状态问题，不是主站到 Turso 的连接问题。

## 验证

```bash
curl -fsSL -X POST \
  -H "Authorization: Bearer $MAIN_SITE_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"operation":"activities.list","input":{"limit":1}}' \
  https://admin.example.com/api/main-site/query
```

错误 Token 应返回 401；成功响应应为 `{ "data": ... }`。主站的 `/api/trpc/activities.list`、详情和洞察请求随后都会通过同一 Admin API。
