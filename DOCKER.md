# Docker 部署指南

## 快速开始

### 1. 构建并启动

```bash
# 构建并启动容器
docker compose up -d --build

# 查看日志
docker compose logs -f
```

访问 http://localhost:3000

### 2. 停止服务

```bash
docker compose down
```

## 配置

### 环境变量

编辑 `docker-compose.yml` 中的 environment 部分：

```yaml
environment:
  - NEXT_PUBLIC_MAP_STYLE=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json
  - NIKE_ACCESS_TOKEN=your_token
  - STRAVA_CLIENT_ID=your_id
  - STRAVA_CLIENT_SECRET=your_secret
  - STRAVA_REFRESH_TOKEN=your_token
```

或者使用 `.env` 文件：

```bash
# 创建 .env 文件
cp .env.example .env.production

# 修改 docker-compose.yml 添加 env_file
env_file:
  - .env.production
```

### 数据持久化

SQLite 数据库存储在 Docker volume 中：

```bash
# 查看 volume
docker volume ls

# 备份数据库
docker cp runpaceflow:/app/data/local.db ./backup.db

# 恢复数据库
docker cp ./backup.db runpaceflow:/app/data/local.db
```

## 生产部署

### 使用自定义端口

```yaml
ports:
  - '8080:3000' # 外部端口:内部端口
```

### 使用反向代理 (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 使用 Traefik (推荐)

```yaml
services:
  runpaceflow:
    # ... 其他配置
    labels:
      - 'traefik.enable=true'
      - 'traefik.http.routers.runpaceflow.rule=Host(`your-domain.com`)'
      - 'traefik.http.routers.runpaceflow.tls.certresolver=letsencrypt'
```

## 常用命令

```bash
# 重新构建
docker compose build --no-cache

# 查看容器状态
docker compose ps

# 进入容器
docker compose exec runpaceflow sh

# 查看资源使用
docker stats runpaceflow

# 清理未使用的镜像
docker image prune -f
```

## 故障排除

### 构建失败

```bash
# 清理 Docker 缓存
docker builder prune -f

# 查看详细构建日志
docker compose build --progress=plain
```

### 容器无法启动

```bash
# 查看日志
docker compose logs runpaceflow

# 检查健康状态
docker inspect runpaceflow --format='{{.State.Health.Status}}'
```

### 数据库问题

```bash
# 进入容器检查数据库
docker compose exec runpaceflow sh
ls -la /app/data/
```
