# 部署指南

## 部署架构

本项目使用以下架构：

- **数据存储**：SQLite 数据库文件存储在 Git 仓库中
- **自动同步**：GitHub Actions 每天自动同步运动数据
- **部署平台**：Vercel 自动部署

## 已完成的配置

✅ 数据库文件 (`data/activities.db`) 已添加到 Git 仓库
✅ 数据库路径已配置为支持 Vercel 环境
✅ GitHub Actions 工作流已创建（`.github/workflows/sync.yml`）

## 设置 GitHub Secrets（用于自动同步）

访问：https://github.com/priority3/runPaceFlow/settings/secrets/actions

添加以下 Secrets：

### 必需：GitHub Personal Access Token (PAT)

- `PAT`：用于 GitHub Actions 推送权限
  1. 访问 https://github.com/settings/tokens/new
  2. 生成新的 Personal Access Token (classic)
  3. 勾选 `repo` 权限（完整的仓库访问权限）
  4. 生成 token 并复制
  5. 添加为仓库 Secret，名称为 `PAT`

### Nike Run Club

- `NIKE_ACCESS_TOKEN`：从浏览器 Network 标签获取
  1. 登录 Nike Run Club 网站
  2. 打开开发者工具 → Network 标签
  3. 找到包含 `Bearer` token 的请求
  4. 复制完整的 token

### Strava（可选）

- `STRAVA_CLIENT_ID`：从 [Strava API 设置](https://www.strava.com/settings/api) 获取
- `STRAVA_CLIENT_SECRET`：同上
- `STRAVA_REFRESH_TOKEN`：通过 OAuth 授权获取

## 工作原理

1. **初始部署**：
   - Vercel 从 GitHub 拉取代码（包括数据库文件）
   - 应用使用 Git 仓库中的 SQLite 数据库

2. **每日更新**：
   - GitHub Actions 每天运行同步脚本
   - 从 Nike/Strava API 获取新数据
   - 更新数据库并提交到 Git
   - Vercel 自动重新部署

## 手动触发同步

如需手动同步数据：

1. 访问 GitHub Actions 页面
2. 选择 "Sync Activities" 工作流
3. 点击 "Run workflow"

## 验证部署

部署成功后，访问 https://run-pace-flow.vercel.app 查看你的运动数据。

## 故障排除

如果数据未显示：

1. 检查 Vercel 部署日志
2. 确认 `data/activities.db` 文件存在
3. 验证 GitHub Actions 运行状态
