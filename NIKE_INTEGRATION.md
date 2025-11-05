# Nike Run Club API 集成完成

## ✅ 已完成的功能

### Phase 1: Nike API Adapter (nike.ts:432 lines)

- ✅ 完整的 API 调用实现
  - `getActivities()` - 分页获取活动列表（支持 `beforeId` 参数）
  - `getActivityDetail()` - 获取活动详情（包含所有指标）
  - `downloadGPX()` - 从 metrics 生成 GPX
- ✅ Token 自动刷新机制
- ✅ NTC 记录过滤（排除 Nike Training Club 训练）
- ✅ 完整的数据转换（summaries + metrics → RawActivity）
- ✅ GPX 生成（支持心率扩展）

### Phase 2: GPX Parser (parser.ts:300 lines)

- ✅ 完整的 GPX XML 解析（使用 fast-xml-parser）
- ✅ 支持 Garmin 心率扩展（TrackPointExtension）
- ✅ Douglas-Peucker 轨迹简化算法
- ✅ 距离和海拔计算

### Phase 3: 数据处理 (processor.ts:227 lines)

- ✅ 支持 Nike 数据格式（通用 RawActivity 接口）
- ✅ 处理无 GPS 数据的活动（跑步机等）
- ✅ 基于真实 GPS 生成分段数据
- ✅ 心率、海拔数据处理

### Phase 4: 增量同步

- ✅ `beforeId` 分页机制
- ✅ 自动过滤已同步的活动
- ✅ 支持断点续传

## 📝 使用方法

### 1. 获取 Nike 认证令牌

需要从 Nike Run Club 应用或网站获取：

- `access_token` - 访问令牌
- `refresh_token` - 刷新令牌（可选但推荐）

### 2. 创建 Nike Adapter 实例

```typescript
import { NikeAdapter } from '@/lib/sync/adapters/nike'

const adapter = new NikeAdapter(
  'your_access_token',
  'your_refresh_token', // 可选
)
```

### 3. 同步活动数据

```typescript
import { syncActivities } from '@/lib/sync/processor'

// 获取所有活动
const rawActivities = await adapter.getActivities({ limit: 50 })

// 同步到数据库
const activityIds = await syncActivities(rawActivities)

console.log(`Synced ${activityIds.length} activities`)
```

### 4. 增量同步（仅获取新活动）

```typescript
// 首次同步
const activities = await adapter.getActivities({ limit: 100 })
const lastActivityId = activities[activities.length - 1]?.id

// 后续增量同步（从上次的最后一个活动开始）
const newActivities = await adapter.getActivities({
  limit: 50,
  beforeId: lastActivityId,
})
```

## 🔧 API 端点说明

### Nike API Base URL

```
https://api.nike.com/plus/v3
```

### 关键端点

1. **获取活动列表**

   ```
   GET /activities/before_id/v3/{activity_id}?limit=30&types=run%2Cjogging&include_deleted=false
   ```

2. **获取活动详情**

   ```
   GET /activity/{activity_id}?metrics=ALL
   ```

3. **刷新令牌**
   ```
   POST https://api.nike.com/idn/shim/oauth/2.0/token
   ```

## 📊 数据格式说明

### Nike API 返回的数据结构

```json
{
  "id": "活动ID",
  "start_epoch_ms": 1234567890000,
  "end_epoch_ms": 1234567890000,
  "active_duration_ms": 1800000,
  "tags": {
    "com.nike.name": "Morning Run"
  },
  "metrics": [
    { "type": "latitude", "values": [...] },
    { "type": "longitude", "values": [...] },
    { "type": "elevation", "values": [...] },
    { "type": "heart_rate", "values": [...] }
  ],
  "summaries": [
    { "metric": "distance", "value": 5.2 },
    { "metric": "heart_rate", "value": 145 }
  ]
}
```

### 转换为 RawActivity

Nike Adapter 会自动转换为统一的 `RawActivity` 格式：

- ✅ 距离单位转换（公里 → 米）
- ✅ 时长转换（毫秒 → 秒）
- ✅ 配速计算（秒/米）
- ✅ GPX 生成（包含心率扩展）

### 生成的 GPX 格式

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Nike Run Club">
  <trk>
    <name>Morning Run</name>
    <type>running</type>
    <trkseg>
      <trkpt lat="39.9042" lon="116.4074">
        <ele>50.0</ele>
        <time>2024-01-01T10:00:00Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>145</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
    </trkseg>
  </trk>
</gpx>
```

## ⚠️ 注意事项

1. **Token 有效期**
   - access_token 通常有效期较短（1-2小时）
   - 建议提供 refresh_token 以自动刷新
   - Adapter 会在 401 错误时自动刷新 token

2. **API 限流**
   - Nike API 可能有速率限制
   - 建议添加适当的延迟和重试逻辑

3. **无 GPS 数据**
   - 跑步机活动没有 GPS 数据
   - Adapter 会生成空的 GPX（仅包含元数据）
   - Processor 会根据总距离生成平均分段

4. **NTC 记录过滤**
   - 自动过滤 app_id 包含 'ntc' 的训练记录
   - 仅同步跑步活动

## 🚀 下一步

Nike API 集成已完成，可以：

1. 在 UI 中添加 Nike 同步按钮
2. 实现定时自动同步
3. 添加同步进度显示
4. 处理错误和重试逻辑

---

**实现完成时间**: 2025-11-06
**总代码行数**: ~1000 行
**TypeScript 错误**: 0
