# H5 App 新页面重建计划

记录日期：2026-07-10

## 背景

当前基金、股票、市场、设置功能分散在旧页面和弹窗中，页面结构更接近桌面 Web/插件面板，不符合新的 H5 App 交互目标。后续不再继续修补旧首页，而是新建一套 `/app` H5 页面体系，逐步迁移现有业务逻辑。

## 目标

- 新建 H5 App 页面入口，先保留旧路由作为回退。
- 底部固定 4 个 Tab：基金、股票、市场中心、我的。
- 基金和股票保留原有业务能力：列表、刷新、新增、删除、编辑、排序、详情。
- 市场中心从弹窗改成页面。
- 设置页改为我的页，使用 H5 App 分组卡片结构。
- 核心业务弹窗全部页面化；普通 Toast/Message 可保留。
- 数据和计算逻辑优先复用现有实现，不重写业务规则。

## 路由规划

旧路由先保留：

- `/`：旧基金页
- `/stock`：旧股票页
- `/option`：旧设置页
- `/totalrevenue`：旧总收益页

新增 App 路由：

- `/app/fund`：基金首页
- `/app/stock`：股票首页
- `/app/market`：市场中心
- `/app/profile`：我的/设置
- `/app/fund/detail/:code`：基金详情页
- `/app/stock/detail/:code`：股票详情页
- `/app/market/index/:code`：指数详情页
- `/app/returns/daily`：今日收益页
- `/app/returns/holding`：持有收益页
- `/app/returns/total`：总收益曲线页
- `/app/profile/login`：登录/注册页
- `/app/profile/config`：配置导入导出页
- `/app/profile/changelog`：更新日志页

迁移完成后，再将 `/` 默认指向 `/app/fund`，旧页面移动到 `/legacy/*` 或保留隐藏入口。

## 页面结构规范

新页面统一使用 H5 App 壳：

- `AppShell`：390/430px 移动端视口容器，处理安全区、背景、暗色模式。
- `AppHeader`：页面标题、刷新、设置、编辑等顶部操作。
- `AppPage`：唯一滚动内容区域，底部预留 TabBar 高度。
- `AppTabBar`：固定底部 4 Tab，不悬浮错位，不遮挡内容。
- `AppCard`：用于指数、资产摘要、设置分组。
- `HoldingList`：基金/股票持仓列表，不使用 `table/tr/td`。

## Tab 交互

### 基金

- 展示市场指数概览、基金收益摘要、自选基金列表。
- 支持新增基金、删除基金、编辑成本价和份额、拖拽排序。
- 点击基金行进入 `/app/fund/detail/:code`。
- 今日收益、持有收益、总收益入口跳转到页面，不再弹窗。

### 股票

- 展示市场指数概览、股票收益摘要、自选股票列表。
- 支持新增股票、删除股票、编辑成本价和份额、拖拽排序。
- 点击股票行进入 `/app/stock/detail/:code`。
- 复用当前股票 API 和 `stockList` 存储结构。

### 市场中心

- 承接原 `market` 弹窗内容。
- 页面内提供资金流、行业/板块、北向/南向等二级入口或分段控件。
- 指数卡片点击进入 `/app/market/index/:code`。

### 我的

- 承接原设置页能力，改为 H5 设置页：
  - 账号信息、登录/退出
  - 云端同步、备份
  - 主题模式
  - 基金/股票展示偏好
  - 历史收益配置
  - 配置导入导出
  - 更新日志、关于

## 弹窗页面化清单

- `fundDetail` -> `/app/fund/detail/:code`
- 股票详情现有复用 `fundDetail` 的部分 -> `/app/stock/detail/:code`
- `indDetail` -> `/app/market/index/:code`
- `market` -> `/app/market`
- `earningsDay` -> `/app/returns/daily`
- `holdingIncome` -> `/app/returns/holding`
- `totalrevenue` -> `/app/returns/total`
- `login` -> `/app/profile/login`
- `configBox` -> `/app/profile/config`
- `changeLog` -> `/app/profile/changelog`

## 迁移策略

1. 新建 `/app` 路由、App 壳和 4 Tab 静态页面。
2. 先验证 H5 结构：390×844 无横向滚动，底部栏不遮挡内容。
3. 迁移基金页数据和交互逻辑到 `/app/fund`。
4. 迁移股票页数据和交互逻辑到 `/app/stock`。
5. 将市场弹窗拆成 `/app/market` 页面。
6. 将设置页拆成 `/app/profile` 及其二级页面。
7. 将详情、收益、登录、配置、日志等弹窗逐个页面化。
8. 新页面稳定后再切换默认入口。

## 验收标准

- `vite build --mode netlify` 构建通过。
- `/app/fund`、`/app/stock`、`/app/market`、`/app/profile` 四个 Tab 可切换。
- 390×844 视口下无横向滚动。
- 底部栏固定在 App 壳底部，主内容不会被遮挡。
- 基金新增、删除、编辑、详情可用。
- 股票新增、删除、编辑、详情可用。
- 市场中心不再作为弹窗打开。
- 我的页设置项可以正常读写 `localStorage`。
- 旧路由在迁移完成前仍可访问。

## 默认决策

- 第四个 Tab 使用“我的/设置”。
- 新页面入口先使用 `/app/fund`，不立即替换 `/`。
- 核心业务弹窗必须页面化，普通轻提示可以保留。
- 新 UI 按 H5 App 规范开发，不再使用桌面表格结构。
