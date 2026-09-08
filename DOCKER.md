# Docker 部署指南

主站容器不连接 SQLite 或 Turso，只需要能访问 Admin 的 HTTP 地址。

## 主站环境变量

```yaml
services:
  runpaceflow:
    environment:
      - RUNPACEFLOW_ADMIN_URL=http://127.0.0.1:3030
      - RUNPACEFLOW_ADMIN_API_TOKEN=${MAIN_SITE_API_TOKEN}
      - NEXT_PUBLIC_MAP_STYLE=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json
```

`MAIN_SITE_API_TOKEN` 必须与 Admin 容器中的值一致。主站不要挂载 `shared.db`，也不要配置 `DATABASE_URL` 或 `DATABASE_AUTH_TOKEN`。

## 启动顺序

1. 启动 Admin，并将 `ACTIVITIES_DATABASE_URL` 指向持久化卷中的 `shared.db`。
2. 确认 Admin `/api/main-site/query` 携带正确 Token 返回活动数据。
3. 启动主站容器并访问 `/api/trpc/activities.list`。

## 常用检查

```bash
docker compose ps
docker compose logs -f runpaceflow-admin
docker compose logs -f runpaceflow
```

主站空状态时，优先检查 Admin 容器的 `shared.db` 挂载路径和活动行数。Turso 镜像异常不会阻塞 shared.db 的主站读取，但会在 Admin 镜像日志中记录失败。
