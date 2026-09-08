# RunPaceFlow

个人运动数据可视化展示端，活动数据由 RunPaceFlow Admin 统一接入和管理。

[English](../README.md)

<p align="center">
  <img src="../public/screenshots/overview.png" alt="RunPaceFlow 首页预览" width="960" />
</p>

<p align="center">
  <img src="../public/screenshots/activity-detail.png" alt="RunPaceFlow 活动详情预览" width="960" />
</p>

## 功能

- 只读展示活动数据库中已有的跑步和骑行记录
- 地图路线可视化与动画回放
- 分段配速分析与图表展示
- Admin 生成并缓存的 AI 跑步分析
- 地图组件懒加载，优化包体积与加载性能
- 从 RunPaceFlow Admin 读取运行时配置
- 响应式设计，适配桌面与移动端

## 数据边界

RunPaceFlow 不再直接接入或同步运动数据。数据接入、第三方平台凭据、AI 生成、PR Agent 工作流和运行时配置都由 RunPaceFlow Admin 管理；主站只调用 Admin 的只读接口读取挂载的 `shared.db`。Turso 仅作为 Admin 侧镜像/备份目标。

## 配置

创建 `.env.local` 文件：

```bash
# 主站调用 Admin 只读接口时必填（两端配置同一 Token）
RUNPACEFLOW_ADMIN_URL=http://localhost:3030
RUNPACEFLOW_ADMIN_API_TOKEN=your_main_site_api_token

# 可选：地图样式
NEXT_PUBLIC_MAP_STYLE=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json

# AI 凭据和模型在 RunPaceFlow Admin 中配置。

# 运动目标配置（可选 - 自定义周/月目标）
NEXT_PUBLIC_WEEKLY_DISTANCE_GOAL=10000
NEXT_PUBLIC_MONTHLY_DISTANCE_GOAL=50000
NEXT_PUBLIC_WEEKLY_DURATION_GOAL=3600
NEXT_PUBLIC_MONTHLY_DURATION_GOAL=18000
```

### AI 分析

AI 由 RunPaceFlow Admin 的 scheduler 生成并写入 `shared.db`，主站只读取缓存结果。

## 本地开发

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev
```

访问 http://localhost:3000

## 部署

主站部署环境配置 `RUNPACEFLOW_ADMIN_URL` 和 `RUNPACEFLOW_ADMIN_API_TOKEN`；Admin 部署环境配置同值的 `MAIN_SITE_API_TOKEN`。Turso 的 `DATABASE_URL` / `DATABASE_AUTH_TOKEN` 只保留在 Admin，用于镜像任务。

## Credits

灵感来源：[yihong0618/running_page](https://github.com/yihong0618/running_page)

## License

MIT
