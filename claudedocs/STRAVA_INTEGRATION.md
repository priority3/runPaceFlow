# Strava Integration Documentation

## 概述

基于 [running_page](https://github.com/yihong0618/running_page) 项目实现的 Strava 数据同步功能，支持从 Strava 同步跑步活动数据到 RunPaceFlow。

## 架构设计

### 核心组件

1. **StravaAdapter** (`src/lib/sync/adapters/strava.ts`)
   - 实现 `SyncAdapter` 接口
   - OAuth2 自动 token 刷新机制
   - 活动分页获取
   - GPS 轨迹流数据获取
   - GPX 格式转换

2. **Sync Router** (`src/lib/trpc/routers/sync.ts`)
   - `syncStrava` mutation: 同步 Strava 活动
   - `getSyncStatus` query: 获取同步状态（支持 Nike 和 Strava）

3. **Test Script** (`scripts/test-strava-sync.sh`)
   - 环境变量检查
   - 数据库初始化
   - 类型检查
   - 开发服务器启动

## 功能特性

### ✅ 已实现功能

- **OAuth2 认证**
  - 使用 Client ID、Client Secret 和 Refresh Token
  - 自动刷新 Access Token（5 分钟提前刷新）
  - Token 过期自动处理

- **活动同步**
  - 分页获取（每页最多 50 条）
  - 支持日期范围过滤
  - 可配置同步数量限制（1-100）
  - 详细活动数据获取

- **GPS 数据处理**
  - 获取 latlng、time、altitude、heartrate、distance 流数据
  - 生成标准 GPX 格式文件
  - 支持心率扩展（TrackPointExtension）

- **数据转换**
  - Strava 活动类型映射到标准类型
  - 速度转换为配速（min/km）
  - 时间戳标准化
  - 心率数据处理

## API 使用

### 1. tRPC 接口

#### syncStrava Mutation

```typescript
// 基本用法
const result = await trpc.sync.syncStrava.mutate({
  limit: 50,
})

// 带日期过滤
const result = await trpc.sync.syncStrava.mutate({
  limit: 30,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
})

// 返回结果
interface SyncResult {
  success: boolean
  count: number
  activityIds: string[]
  message: string
}
```

#### getSyncStatus Query

```typescript
const status = await trpc.sync.getSyncStatus.useQuery()

// 返回结果
interface SyncStatus {
  nike: {
    hasToken: boolean
    hasRefreshToken: boolean
    latestSync: SyncLog | null
  }
  strava: {
    hasCredentials: boolean
    latestSync: SyncLog | null
  }
}
```

### 2. Adapter 直接使用

```typescript
import { StravaAdapter } from '@/lib/sync/adapters/strava'

// 创建适配器实例
const adapter = new StravaAdapter(
  process.env.STRAVA_CLIENT_ID!,
  process.env.STRAVA_CLIENT_SECRET!,
  process.env.STRAVA_REFRESH_TOKEN!
)

// 认证
const authenticated = await adapter.authenticate({})

// 获取活动
const activities = await adapter.getActivities({
  limit: 50,
  startDate: new Date('2024-01-01'),
})

// 健康检查
const isHealthy = await adapter.healthCheck()
```

## 配置说明

### 环境变量

在 `.env.local` 中配置以下环境变量：

```env
# Strava OAuth2 认证
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REFRESH_TOKEN=your_refresh_token
```

### 获取 Strava API 凭证

#### 1. 创建 API Application

访问 [Strava API Settings](https://www.strava.com/settings/api) 并创建新应用：

- **Application Name**: RunPaceFlow
- **Category**: Training
- **Website**: http://localhost:3000
- **Authorization Callback Domain**: localhost

创建后获得：
- **Client ID**
- **Client Secret**

#### 2. 获取 Refresh Token

通过 OAuth2 授权流程获取 Refresh Token：

**步骤 1: 访问授权 URL**

```
https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all
```

**步骤 2: 授权并获取 code**

授权后，浏览器会重定向到：
```
http://localhost/?state=&code=YOUR_AUTHORIZATION_CODE&scope=read,activity:read_all
```

复制 `code` 参数值。

**步骤 3: 用 code 换取 refresh_token**

```bash
curl -X POST https://www.strava.com/oauth/token \
  -d client_id=YOUR_CLIENT_ID \
  -d client_secret=YOUR_CLIENT_SECRET \
  -d code=YOUR_AUTHORIZATION_CODE \
  -d grant_type=authorization_code
```

响应示例：
```json
{
  "token_type": "Bearer",
  "expires_at": 1704067200,
  "expires_in": 21600,
  "refresh_token": "YOUR_REFRESH_TOKEN",
  "access_token": "YOUR_ACCESS_TOKEN",
  "athlete": { ... }
}
```

复制 `refresh_token` 到 `.env.local` 文件。

## 数据模型

### Strava API 响应

#### Activity Object

```typescript
interface StravaActivity {
  id: number
  name: string
  type: string  // Run, TrailRun, VirtualRun
  start_date: string
  start_date_local: string
  distance: number  // meters
  moving_time: number  // seconds
  elapsed_time: number  // seconds
  total_elevation_gain: number
  average_speed: number  // m/s
  max_speed: number  // m/s
  average_heartrate?: number
  max_heartrate?: number
  calories?: number
  map?: {
    summary_polyline: string
    polyline?: string
  }
}
```

#### Stream Object

```typescript
interface StravaStream {
  type: string  // latlng, time, altitude, heartrate, distance
  data: number[]
  series_type: string
  original_size: number
  resolution: string
}
```

### 转换后的数据格式

```typescript
interface RawActivity {
  id: string
  source: 'strava'
  sourceId: string
  type: 'running' | 'cycling' | 'walking' | 'swimming' | 'other'
  title: string
  startTime: Date
  endTime: Date
  duration: number  // seconds
  distance: number  // meters
  averagePace?: number  // seconds per km
  bestPace?: number  // seconds per km
  elevationGain?: number  // meters
  heartRate?: {
    average: number
    max: number
  }
  calories?: number
  gpxData?: string  // GPX XML format
  rawData: any
}
```

## GPX 格式生成

### 生成的 GPX 结构

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RunPaceFlow Strava Sync"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>Activity Name</name>
    <time>2024-01-01T08:00:00Z</time>
  </metadata>
  <trk>
    <name>Activity Name</name>
    <type>Run</type>
    <trkseg>
      <trkpt lat="39.9042" lon="116.4074">
        <ele>100</ele>
        <time>2024-01-01T08:00:00Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>140</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
      <!-- More track points -->
    </trkseg>
  </trk>
</gpx>
```

## API 限制

### Strava API 速率限制

- **15 分钟限制**: 100 次请求
- **每日限制**: 1000 次请求

### 分页限制

- **每页最大**: 50 条活动
- **推荐策略**: 首次同步 limit=50，增量同步 limit=10

### 最佳实践

1. **避免频繁同步**
   - 使用增量同步（设置 startDate）
   - 合理设置 limit 参数

2. **错误处理**
   - 单个活动失败不影响整体同步
   - 自动跳过无法获取的活动
   - 记录详细错误日志

3. **Token 管理**
   - Refresh Token 长期有效
   - Access Token 自动刷新
   - 提前 5 分钟刷新策略

## 测试方法

### 1. 使用测试脚本

```bash
# 检查环境配置并启动开发服务器
./scripts/test-strava-sync.sh
```

脚本会自动执行：
1. ✅ 检查环境变量配置
2. ✅ 创建/检查数据库
3. ✅ TypeScript 类型检查
4. ✅ 启动开发服务器

### 2. 手动测试步骤

```bash
# 1. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 Strava credentials

# 2. 创建数据库
bun run db:push

# 3. 类型检查
bun run type-check

# 4. 启动开发服务器
bun run dev
```

### 3. 测试同步功能

访问 http://localhost:3000，使用 tRPC 接口测试：

```typescript
// 在浏览器 DevTools Console 中
// 测试同步 50 条活动
await window.__NEXT_DATA__.trpc.sync.syncStrava.mutate({ limit: 50 })

// 查看同步状态
await window.__NEXT_DATA__.trpc.sync.getSyncStatus.query()
```

## 故障排除

### 常见问题

#### 1. "Strava credentials not configured"

**原因**: 缺少环境变量配置

**解决**:
- 检查 `.env.local` 文件是否存在
- 确认包含 `STRAVA_CLIENT_ID`、`STRAVA_CLIENT_SECRET`、`STRAVA_REFRESH_TOKEN`

#### 2. "Strava authentication failed"

**原因**: Token 无效或已过期

**解决**:
- 重新生成 Refresh Token
- 检查 Client ID 和 Client Secret 是否正确

#### 3. "Failed to fetch activity"

**原因**:
- 网络问题
- API 限制达到
- 活动权限问题

**解决**:
- 检查网络连接
- 等待 API 限制重置（15 分钟）
- 确认 OAuth scope 包含 `activity:read_all`

#### 4. 同步数量不符合预期

**原因**:
- 日期过滤
- API 限制
- 活动类型过滤

**解决**:
- 检查 startDate/endDate 参数
- 增加 limit 参数
- 确认活动类型在支持列表内

## 技术细节

### Token 刷新机制

```typescript
private async ensureValidToken(): Promise<void> {
  const now = Math.floor(Date.now() / 1000)

  // 提前 5 分钟刷新（300 秒）
  if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > now + 300) {
    return
  }

  // 使用 refresh_token 获取新的 access_token
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken,
    }),
  })

  const data = await response.json()
  this.accessToken = data.access_token
  this.refreshToken = data.refresh_token  // 更新 refresh_token
  this.tokenExpiresAt = data.expires_at
}
```

### 活动类型映射

```typescript
private mapActivityType(stravaType: string): string {
  const typeMap: Record<string, string> = {
    Run: 'running',
    TrailRun: 'running',
    VirtualRun: 'running',
    Ride: 'cycling',
    VirtualRide: 'cycling',
    Walk: 'walking',
    Hike: 'walking',
    Swim: 'swimming',
  }
  return typeMap[stravaType] || 'other'
}
```

### 配速计算

```typescript
// Strava 提供平均速度（m/s），需要转换为配速（秒/公里）
const averagePace = activity.average_speed > 0
  ? 1000 / activity.average_speed
  : undefined

// 例如：速度 3.33 m/s = 配速 300 秒/公里 = 5:00 min/km
```

## 性能优化

### 1. 分页策略

```typescript
// 使用分页避免单次请求过大
while (activities.length < totalLimit) {
  const params = new URLSearchParams({
    page: currentPage.toString(),
    per_page: '50',  // Strava 最大值
  })
  // ...
  currentPage++
}
```

### 2. 错误处理

```typescript
// 单个活动失败不影响整体同步
for (const activity of pageActivities) {
  try {
    const detailedActivity = await this.getActivityDetail(activity.id)
    activities.push(detailedActivity)
  } catch (error) {
    console.error(`Failed to fetch activity ${activity.id}:`, error)
    // 继续处理其他活动
  }
}
```

### 3. Stream 数据可选

```typescript
// GPS 流数据获取失败时继续处理
try {
  const streamsResponse = await fetch(...)
  if (streamsResponse.ok) {
    streams = await streamsResponse.json()
  }
} catch (error) {
  console.error('Failed to fetch streams:', error)
  // 不中断，继续生成没有 GPS 数据的活动记录
}
```

## 与 Nike 集成的对比

| 特性 | Nike Run Club | Strava |
|------|---------------|--------|
| **认证方式** | Access Token / Refresh Token | OAuth2 (Client ID + Secret + Refresh Token) |
| **Token 刷新** | 手动/自动 | 自动（透明） |
| **数据源** | Nike 官方 API | Strava API v3 |
| **GPS 数据** | JSON 格式 | GPX 流数据 |
| **活动类型** | 跑步为主 | 多种运动类型 |
| **API 限制** | 未知 | 100 次/15分钟，1000 次/天 |
| **分页支持** | 是 | 是（per_page=50） |
| **日期过滤** | 支持 | 支持 |

## 下一步开发

### 待实现功能

- [ ] Strava 同步按钮组件（UI）
- [ ] 同步状态显示组件
- [ ] 批量同步进度条
- [ ] 同步历史记录查看
- [ ] 增量同步优化
- [ ] Webhook 实时同步

### 可选增强

- [ ] 活动详情页 Strava 链接
- [ ] 同步冲突解决策略
- [ ] 多账号支持
- [ ] 数据导出功能
- [ ] 统计数据对比（Nike vs Strava）

## 参考资源

- [Strava API Documentation](https://developers.strava.com/docs/reference/)
- [Strava API Playground](https://developers.strava.com/playground/)
- [running_page Project](https://github.com/yihong0618/running_page)
- [GPX Format Specification](https://www.topografix.com/GPX/1/1/)

## 版本历史

### v1.0.0 (2024-01-06)

初始实现：
- ✅ OAuth2 认证与 token 管理
- ✅ 活动同步（分页、日期过滤）
- ✅ GPS 流数据获取
- ✅ GPX 格式生成
- ✅ tRPC 路由集成
- ✅ 测试脚本
- ✅ 完整文档
