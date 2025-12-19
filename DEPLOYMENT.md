# 部署指南：解决 Vercel 上的数据问题

## 问题说明

Vercel 部署成功但没有数据，因为：

1. SQLite 文件 (`data/activities.db`) 在本地，不会自动上传到 Vercel
2. Vercel 的 serverless 环境无法持久化文件

## 解决方案

### 方案 1：使用 GitHub 存储数据（推荐，免费）

这个方案将数据文件提交到 Git 仓库，Vercel 部署时会包含数据。

#### 步骤：

1. **将数据文件添加到 Git**：

```bash
# 确保数据文件存在
ls -la data/activities.db

# 添加到 Git
git add -f data/activities.db
git commit -m "feat: Add activities database"
git push
```

2. **设置 GitHub Actions 自动同步**（已创建）：
   - 工作流文件：`.github/workflows/sync.yml`
   - 每天自动从 Nike/Strava 同步数据
   - 需要在 GitHub 仓库设置 Secrets

3. **在 GitHub 设置 Secrets**：
   访问：https://github.com/priority3/runPaceFlow/settings/secrets/actions

   添加以下 Secrets：
   - `NIKE_ACCESS_TOKEN`：从浏览器获取
   - `STRAVA_CLIENT_ID`：从 Strava API 设置获取
   - `STRAVA_CLIENT_SECRET`：从 Strava API 设置获取
   - `STRAVA_REFRESH_TOKEN`：从 Strava 授权获取

4. **触发重新部署**：
   - Push 代码后，Vercel 会自动重新部署
   - 这次部署会包含 `data/activities.db` 文件

### 方案 2：使用 Turso 云数据库（可选，更专业）

如果你想要更专业的解决方案，可以使用 Turso（SQLite 云服务）。

#### 步骤：

1. **注册 Turso**：https://turso.tech

2. **创建数据库**：

```bash
# 安装 CLI
brew install tursodatabase/tap/turso

# 登录
turso auth login

# 创建数据库
turso db create runpaceflow

# 获取连接信息
turso db show runpaceflow --url
turso db tokens create runpaceflow
```

3. **迁移数据**：

```bash
# 设置环境变量
export TURSO_DATABASE_URL="你的数据库URL"
export TURSO_AUTH_TOKEN="你的认证Token"

# 运行迁移脚本
./scripts/migrate-to-turso.sh
```

4. **在 Vercel 设置环境变量**：
   访问：https://vercel.com/你的用户名/run-pace-flow/settings/environment-variables

   添加：
   - `DATABASE_URL`：Turso 数据库 URL
   - `DATABASE_AUTH_TOKEN`：Turso 认证 Token

## 快速修复（立即让网站工作）

最快的方法是使用方案 1：

```bash
# 1. 添加数据文件到 Git
git add -f data/activities.db

# 2. 提交并推送
git commit -m "feat: Add activities database for production"
git push

# 3. 等待 Vercel 自动重新部署（1-2 分钟）
```

## 验证

部署完成后，访问 https://run-pace-flow.vercel.app 应该能看到你的运动数据了。

## 注意事项

- 方案 1 简单免费，适合个人项目
- 方案 2 更专业，适合需要实时更新的场景
- GitHub Actions 会每天自动同步新数据
- 记得设置 GitHub Secrets 以启用自动同步
