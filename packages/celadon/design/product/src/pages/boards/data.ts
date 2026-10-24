import type { IconId } from '../../../../app/src/platform/icons/icon-ids'

export type BoardTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral'
export type BoardRunStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'stopped' | 'cancelled'
export type BoardStatus = BoardRunStatus | 'waiting'
export type BoardFilter = 'all' | BoardStatus

export type BoardMessage = {
  from: 'user' | 'bot'
  text: string
  time: string
  attachment?: string
}

export type BoardFile = {
  name: string
  size: string
  kind: 'pdf' | 'sheet' | 'file' | 'code'
}

export type BoardService = {
  name: string
  port: number
  status: 'running' | 'stopped'
}

export type BoardTask = {
  id: string
  title: string
  description: string
  status: BoardStatus
  columnId: string
  progress?: number
  activity?: string
  workspace: string
  assistant: string
  tags: string[]
  pinned?: boolean
  schedule?: string
  nextRun?: string
  runCount?: number
  updatedAt: string
  inputs?: BoardFile[]
  outputs?: BoardFile[]
  services?: BoardService[]
  messages?: BoardMessage[]
}

export type BoardColumn = {
  id: string
  title: string
  icon: IconId
  tone: BoardTone
}

export type BoardData = {
  id: string
  title: string
  english: string
  icon: IconId
  tone: BoardTone
  description: string
  updatedAt: string
  columns: BoardColumn[]
  tasks: BoardTask[]
}

export type BoardSummary = {
  id: string
  title: string
  english: string
  icon: IconId
  tone: BoardTone
  taskCount: number
}

export const statusMeta: Record<BoardStatus, { label: string; icon: IconId; tone: BoardTone }> = {
  pending: { label: '待开始', icon: 'i-state-queued', tone: 'neutral' },
  queued: { label: '已排队', icon: 'i-state-queued', tone: 'neutral' },
  running: { label: '运行中', icon: 'i-state-loading', tone: 'brand' },
  waiting: { label: '等待输入', icon: 'i-state-warning', tone: 'warning' },
  completed: { label: '已完成', icon: 'i-check', tone: 'success' },
  failed: { label: '失败', icon: 'i-state-error', tone: 'danger' },
  stopped: { label: '已停止', icon: 'i-state-info', tone: 'neutral' },
  cancelled: { label: '已取消', icon: 'i-state-error', tone: 'danger' },
}

export const boards: Record<string, BoardData> = {
  'board-ops': {
    id: 'board-ops',
    title: '业务工作台',
    english: 'Business operations',
    icon: 'i-board',
    tone: 'brand',
    description: '把市场、数据、内容与客户的日常任务放在同一张看板上。',
    updatedAt: '12 分钟前更新',
    columns: [
      { id: 'col-market', title: '市场调研', icon: 'i-search', tone: 'brand' },
      { id: 'col-report', title: '数据报告', icon: 'i-tasks', tone: 'success' },
      { id: 'col-content', title: '内容运营', icon: 'i-book', tone: 'warning' },
      { id: 'col-customer', title: '客户洞察', icon: 'i-bot', tone: 'success' },
    ],
    tasks: [
      {
        id: 'task-sea-policy',
        title: '调研东南亚市场准入政策',
        description: '整理越南、泰国、印尼三国的市场准入要求，包括本地化合规、支付牌照与数据本地化。',
        status: 'running',
        columnId: 'col-market',
        progress: 40,
        activity: '正在整理印尼 OJK 金融监管要求',
        workspace: 'sea-market-research',
        assistant: '市场研究助手',
        tags: ['东南亚', '合规'],
        pinned: true,
        schedule: '工作日 09:00',
        nextRun: '明天 09:00',
        runCount: 18,
        updatedAt: '12 分钟前',
        inputs: [
          { name: '东南亚市场概览.pdf', size: '2.4 MB', kind: 'pdf' },
          { name: '合规清单模板.xlsx', size: '56 KB', kind: 'sheet' },
        ],
        services: [
          { name: 'Research index', port: 3000, status: 'running' },
          { name: 'Source watcher', port: 8080, status: 'running' },
        ],
        messages: [
          { from: 'user', text: '帮我调研东南亚三个国家的市场准入政策，重点关注金融科技领域。', time: '10:02' },
          { from: 'bot', text: '收到。我会按国家逐一整理准入条件、牌照要求、数据本地化政策与本地合作伙伴要求。越南和泰国部分已完成，正在分析印尼 OJK 的金融科技监管框架。', time: '10:08' },
          { from: 'user', text: '先把有差异的地方标出来，尤其是外资持股和支付牌照。', time: '10:14' },
          { from: 'bot', text: '已标出三处差异：越南要求本地银行合作，泰国允许沙盒期外资全资，印尼对支付牌照设分级资本要求。正在补来源链接。', time: '10:21' },
        ],
      },
      {
        id: 'task-competitor',
        title: '竞品功能对比分析',
        description: '对比主要竞品最近 3 个月的新功能上线情况，整理成对比矩阵。',
        status: 'completed',
        columnId: 'col-market',
        progress: 100,
        workspace: 'sea-market-research',
        assistant: '市场研究助手',
        tags: ['竞品', '分析'],
        updatedAt: '6 小时前',
        outputs: [
          { name: '竞品对比矩阵.xlsx', size: '85 KB', kind: 'sheet' },
          { name: '分析要点.md', size: '12 KB', kind: 'file' },
        ],
        messages: [
          { from: 'user', text: '对比一下主要竞品最近三个月的新功能。', time: '09:10' },
          { from: 'bot', text: '已完成 8 个竞品的对比矩阵，并按协作、模型与权限三条产品线拆开。最明显的差异是团队空间的可观察性。', time: '09:42' },
        ],
      },
      {
        id: 'task-industry',
        title: '用户行业分布趋势报告',
        description: '用行业标签重新分类现有用户，并和去年同期对比，找出增长最快的行业。',
        status: 'waiting',
        columnId: 'col-market',
        activity: '约 15% 用户缺少行业标签，等待确认处理方式',
        workspace: 'user-analytics',
        assistant: '数据分析助手',
        tags: ['用户分析'],
        updatedAt: '30 分钟前',
        messages: [
          { from: 'user', text: '按行业重新看一下用户分布，和去年对比。', time: '09:35' },
          { from: 'bot', text: '在分类过程中发现约 15% 的用户缺少行业标签。请确认：按注册信息推断，还是先排除这部分用户？', time: '09:58' },
        ],
      },
      {
        id: 'task-revenue',
        title: '生成 6 月份营收周报',
        description: '汇总本周各产品线营收数据，与上周及去年同期对比，自动生成图表和摘要。',
        status: 'running',
        columnId: 'col-report',
        progress: 65,
        activity: '生成对比图表',
        workspace: 'finance-reports',
        assistant: '数据分析助手',
        tags: ['营收', '周报'],
        schedule: '每周一 08:30',
        nextRun: '周一 08:30',
        runCount: 12,
        updatedAt: '3 分钟前',
        inputs: [
          { name: '财务原始数据.csv', size: '890 KB', kind: 'file' },
          { name: '去年同期数据.xlsx', size: '156 KB', kind: 'sheet' },
        ],
        services: [{ name: 'Jupyter Notebook', port: 8888, status: 'running' }],
        messages: [
          { from: 'user', text: '生成本周营收周报，跟上周和去年同期对比。', time: '10:12' },
          { from: 'bot', text: '本周合计 ¥260.5 万，环比 +4.2%，同比 +18.7%。数据已汇总，正在生成对比图表。', time: '10:18' },
        ],
      },
      {
        id: 'task-retention',
        title: '用户留存率深度分析',
        description: '按注册渠道、行业、公司规模分维度分析 30/60/90 天留存率，找出流失关键节点。',
        status: 'completed',
        columnId: 'col-report',
        progress: 100,
        workspace: 'user-analytics',
        assistant: '数据分析助手',
        tags: ['留存', '用户分析'],
        updatedAt: '4 小时前',
        outputs: [
          { name: '留存率分析报告.pdf', size: '340 KB', kind: 'pdf' },
          { name: '原始数据.csv', size: '1.2 MB', kind: 'file' },
        ],
        messages: [
          { from: 'user', text: '看一下不同渠道的留存差异。', time: '06:15' },
          { from: 'bot', text: '已完成分析。自然搜索渠道的 30 天留存最高，付费投放渠道在第 14 天出现明显下滑。报告和原始数据已放回工作区。', time: '07:08' },
        ],
      },
      {
        id: 'task-ops-daily',
        title: '每日运营数据看板刷新',
        description: '每天 08:00 自动拉取前一天的核心运营指标，更新数据看板。',
        status: 'completed',
        columnId: 'col-report',
        progress: 100,
        workspace: 'ops-dashboard',
        assistant: '数据分析助手',
        tags: ['运营', '日报'],
        schedule: '每日 08:00',
        nextRun: '明天 08:00',
        runCount: 42,
        updatedAt: '4 小时前',
        outputs: [{ name: 'ops-daily.csv', size: '220 KB', kind: 'file' }],
        messages: [
          { from: 'bot', text: '今日看板已刷新。DAU 12,340（+3.2%），新增 580，付费转化 2.1%。', time: '08:03' },
        ],
      },
      {
        id: 'task-release-note',
        title: '撰写产品更新公告',
        description: '根据本周上线的功能列表，撰写面向用户的产品更新公告，中英双语。',
        status: 'waiting',
        columnId: 'col-content',
        activity: '两个功能描述需要确认口径',
        workspace: 'blog-content',
        assistant: '内容运营助手',
        tags: ['公告', '内容'],
        updatedAt: '1 小时前',
        messages: [
          { from: 'user', text: '根据这周上线的功能清单，写一份产品更新公告，要中英双语。', time: '08:40' },
          { from: 'bot', text: '初稿已完成。有两个点需要确认：智能推荐功能强调「个性化」还是「效率提升」；定价调整是否需要在公告中提及？', time: '09:03' },
        ],
      },
      {
        id: 'task-seo',
        title: '生成 SEO 优化文章',
        description: '围绕「企业数据分析平台」关键词簇，生成 3 篇 SEO 友好的博客文章。',
        status: 'running',
        columnId: 'col-content',
        progress: 33,
        activity: '撰写第 1 篇：企业数据分析的 5 个常见误区',
        workspace: 'blog-content',
        assistant: '内容运营助手',
        tags: ['SEO', '博客'],
        updatedAt: '8 分钟前',
        messages: [
          { from: 'user', text: '围绕企业数据分析平台写三篇 SEO 文章。', time: '09:12' },
          { from: 'bot', text: '关键词分析完成，确定三个主题方向。正在写第一篇，先拆常见误区。', time: '09:26' },
        ],
      },
      {
        id: 'task-social',
        title: '社交媒体素材批量生成',
        description: '根据最近的产品亮点，生成一周的社交媒体配文，每个平台风格不同。',
        status: 'failed',
        columnId: 'col-content',
        progress: 50,
        activity: 'LinkedIn 英文配文翻译服务响应超时',
        workspace: 'social-media',
        assistant: '内容运营助手',
        tags: ['社媒', '内容'],
        updatedAt: '20 分钟前',
        messages: [
          { from: 'user', text: '把最近的产品亮点做成一周的社媒素材。', time: '08:20' },
          { from: 'bot', text: '微博和小红书部分已完成并保存。LinkedIn 英文配文在翻译服务处超时，需要重试。', time: '08:42' },
        ],
      },
      {
        id: 'task-complaints',
        title: '分析本月客户投诉主题',
        description: '从客服工单系统导出本月投诉记录，用主题聚类找出 Top 5 问题类别和趋势。',
        status: 'running',
        columnId: 'col-customer',
        progress: 55,
        activity: '对 1,247 条工单进行主题聚类',
        workspace: 'customer-insights',
        assistant: '数据分析助手',
        tags: ['客服', '投诉分析'],
        updatedAt: '5 分钟前',
        messages: [
          { from: 'user', text: '分析一下这个月的客户投诉，看看主要问题是什么。', time: '09:50' },
          { from: 'bot', text: '已导出 1,247 条工单，清洗后有效 1,183 条。初步看到响应速度、功能缺失和账单问题是前三大类别，正在细化。', time: '10:04' },
        ],
      },
      {
        id: 'task-satisfaction',
        title: '企业客户满意度回访整理',
        description: '整理上周 20 家企业客户的回访记录，提取关键需求和满意度评分，生成摘要。',
        status: 'pending',
        columnId: 'col-customer',
        workspace: 'customer-insights',
        assistant: '市场研究助手',
        tags: ['客户回访', '满意度'],
        updatedAt: '3 小时前',
        messages: [
          { from: 'user', text: '把上周企业客户回访记录整理成摘要。', time: '07:10' },
        ],
      },
      {
        id: 'task-churn',
        title: '客户流失预警监控',
        description: '每天扫描用户活跃数据，识别近 7 天活跃度显著下降的付费客户，输出预警名单。',
        status: 'running',
        columnId: 'col-customer',
        progress: 100,
        activity: '等待下次调度（每日 09:00）',
        workspace: 'customer-insights',
        assistant: '数据分析助手',
        tags: ['流失预警', '自动化'],
        pinned: true,
        schedule: '每日 09:00',
        nextRun: '明天 09:00',
        runCount: 28,
        updatedAt: '2 小时前',
        outputs: [{ name: 'churn-watchlist.csv', size: '48 KB', kind: 'file' }],
        messages: [
          { from: 'bot', text: '今日扫描完成：发现 8 个高风险客户，活跃度下降超过 50%。预警名单已推送至客户成功团队。', time: '09:05' },
        ],
      },
    ],
  },
  'board-product': {
    id: 'board-product',
    title: '产品迭代',
    english: 'Product delivery',
    icon: 'i-tasks',
    tone: 'warning',
    description: '从需求评审到发布，跟踪产品迭代中的每一项交付。',
    updatedAt: '1 小时前更新',
    columns: [
      { id: 'col-review', title: '需求评审', icon: 'i-state-warning', tone: 'warning' },
      { id: 'col-build', title: '设计开发', icon: 'i-file-code', tone: 'brand' },
      { id: 'col-test', title: '测试验收', icon: 'i-check', tone: 'danger' },
      { id: 'col-live', title: '已上线', icon: 'i-state-info', tone: 'success' },
    ],
    tasks: [
      {
        id: 'task-release-v25',
        title: 'V2.5 版本发布准备',
        description: '整合 V2.5 所有功能分支，执行发布前检查清单，准备 changelog。',
        status: 'pending',
        columnId: 'col-review',
        workspace: 'release-v25',
        assistant: '开发助手',
        tags: ['发布', '检查清单'],
        updatedAt: '6 小时前',
        messages: [{ from: 'user', text: '准备一下 V2.5 的发布检查。', time: '09:00' }],
      },
      {
        id: 'task-rbac',
        title: '用户权限模块重构',
        description: '重新设计 RBAC 权限体系，支持自定义角色和细粒度资源授权。',
        status: 'running',
        columnId: 'col-build',
        progress: 60,
        activity: '实现角色继承逻辑',
        workspace: 'rbac-redesign',
        assistant: '开发助手',
        tags: ['权限', '重构'],
        pinned: true,
        updatedAt: '15 分钟前',
        services: [{ name: 'API server', port: 3000, status: 'running' }],
        messages: [
          { from: 'user', text: '把权限模型改成可继承的角色。', time: '08:20' },
          { from: 'bot', text: '基础 RBAC 模型已完成，正在实现角色继承与权限传递，之后补一组越权用例。', time: '09:38' },
        ],
      },
      {
        id: 'task-mobile',
        title: '移动端适配优化',
        description: '针对 iPad 和手机端进行响应式布局调整，优化触控交互体验。',
        status: 'waiting',
        columnId: 'col-build',
        activity: '横屏侧边栏行为需要确认',
        workspace: 'mobile-adapt',
        assistant: '开发助手',
        tags: ['移动端', '响应式'],
        updatedAt: '1 小时前',
        messages: [
          { from: 'user', text: '把移动端布局收紧一点。', time: '08:45' },
          { from: 'bot', text: '发现 iPad 横屏和竖屏的侧边栏行为不一致。横屏时是否默认展开侧边栏？', time: '09:12' },
        ],
      },
      {
        id: 'task-db-index',
        title: '数据库索引优化',
        description: '分析慢查询日志，识别缺失索引并生成优化建议。',
        status: 'running',
        columnId: 'col-build',
        progress: 45,
        activity: '分析 Top 20 慢查询',
        workspace: 'db-optimization',
        assistant: '开发助手',
        tags: ['数据库', '性能'],
        updatedAt: '10 分钟前',
        messages: [
          { from: 'user', text: '看下慢查询，有没有缺索引。', time: '09:00' },
          { from: 'bot', text: '已识别 12 条高频慢查询，正在分析索引覆盖情况。', time: '09:46' },
        ],
      },
      {
        id: 'task-api-perf',
        title: 'API 性能压测报告',
        description: '对核心 API 接口进行压力测试，输出 QPS、P99 延迟、错误率等指标报告。',
        status: 'completed',
        columnId: 'col-test',
        progress: 100,
        workspace: 'perf-testing',
        assistant: '数据分析助手',
        tags: ['压测', 'API'],
        updatedAt: '4 小时前',
        outputs: [{ name: 'api-perf.pdf', size: '1.8 MB', kind: 'pdf' }],
        messages: [{ from: 'bot', text: '压测完成，报告已生成。核心接口 P99 为 182ms，错误率 0.03%。', time: '07:50' }],
      },
      {
        id: 'task-unit-test',
        title: '单元测试覆盖率提升',
        description: '为核心业务模块补充单元测试，目标覆盖率从 65% 提升到 80%。',
        status: 'running',
        columnId: 'col-test',
        progress: 30,
        activity: '编写用户模块测试用例',
        workspace: 'unit-tests',
        assistant: '开发助手',
        tags: ['测试', '覆盖率'],
        updatedAt: '20 分钟前',
        messages: [
          { from: 'user', text: '把核心模块的覆盖率补到 80%。', time: '08:30' },
          { from: 'bot', text: 'auth 模块已完成，覆盖率 92%；正在补 user 模块。', time: '09:40' },
        ],
      },
      {
        id: 'task-i18n',
        title: '国际化文案校对',
        description: '校对英文、日文界面翻译的准确性和一致性，标注需要修正的条目。',
        status: 'completed',
        columnId: 'col-live',
        progress: 100,
        workspace: 'i18n-review',
        assistant: '内容运营助手',
        tags: ['国际化', '文案'],
        updatedAt: '47 小时前',
        outputs: [{ name: 'i18n-review.csv', size: '76 KB', kind: 'sheet' }],
        messages: [{ from: 'bot', text: '英文与日文校对完成，标出 14 条需要统一术语的文案。', time: '昨天' }],
      },
    ],
  },
  'board-customer': {
    id: 'board-customer',
    title: '客户成功',
    english: 'Customer success',
    icon: 'i-bot',
    tone: 'success',
    description: '客户对接、方案交付与培训支持的全流程。',
    updatedAt: '2 小时前更新',
    columns: [
      { id: 'col-onboard', title: '客户对接', icon: 'i-mail', tone: 'warning' },
      { id: 'col-deliver', title: '方案交付', icon: 'i-folder', tone: 'brand' },
      { id: 'col-training', title: '培训支持', icon: 'i-book', tone: 'success' },
    ],
    tasks: [
      {
        id: 'task-onboarding',
        title: '新客户 Onboarding 流程',
        description: '为本月 5 家新签客户准备 onboarding 资料包，包括操作指南、最佳实践和 FAQ。',
        status: 'completed',
        columnId: 'col-onboard',
        progress: 100,
        workspace: 'client-onboarding',
        assistant: '内容运营助手',
        tags: ['Onboarding', '资料'],
        updatedAt: '22 小时前',
        outputs: [{ name: 'onboarding-pack.pdf', size: '4.2 MB', kind: 'pdf' }],
        messages: [{ from: 'bot', text: '五家客户的 onboarding 资料包已生成，共 3 份文档和 1 份 FAQ。', time: '昨天' }],
      },
      {
        id: 'task-survey',
        title: '季度客户满意度调研',
        description: '设计并发送 Q2 客户满意度问卷，收集反馈数据并生成分析报告。',
        status: 'running',
        columnId: 'col-onboard',
        progress: 40,
        activity: '收集问卷回复（已收到 34/80）',
        workspace: 'customer-survey',
        assistant: '市场研究助手',
        tags: ['满意度', '调研'],
        schedule: '每 12 小时',
        nextRun: '20:00',
        runCount: 3,
        updatedAt: '2 小时前',
        messages: [
          { from: 'user', text: '发一下 Q2 的客户满意度问卷。', time: '09:00' },
          { from: 'bot', text: '问卷已发送至 80 家核心客户，目前收回 34 份。初步 NPS 为 72，高于上季度。', time: '10:15' },
        ],
      },
      {
        id: 'task-deploy',
        title: 'XX 企业定制化部署',
        description: '根据客户需求完成私有化部署方案设计，包括网络架构、数据迁移和安全合规。',
        status: 'running',
        columnId: 'col-deliver',
        progress: 70,
        activity: '配置安全网关和证书',
        workspace: 'xx-enterprise-deploy',
        assistant: '部署助手',
        tags: ['私有化', '部署'],
        pinned: true,
        updatedAt: '1 小时前',
        services: [
          { name: 'Admin console', port: 8443, status: 'running' },
          { name: 'Migration job', port: 9100, status: 'stopped' },
        ],
        messages: [
          { from: 'user', text: '客户要求这周完成生产环境切流。', time: '08:00' },
          { from: 'bot', text: '数据迁移脚本已完成验证，正在配置生产环境的安全网关和 SSL 证书。', time: '09:30' },
        ],
      },
      {
        id: 'task-training',
        title: '产品培训课件更新',
        description: '根据 V2.4 新功能更新培训课件和演示视频脚本。',
        status: 'waiting',
        columnId: 'col-training',
        activity: '两个培训范围需要确认',
        workspace: 'training-materials',
        assistant: '内容运营助手',
        tags: ['培训', '课件'],
        updatedAt: '3 小时前',
        messages: [
          { from: 'user', text: '把 V2.4 新功能加进培训课件。', time: '07:50' },
          { from: 'bot', text: '课件初稿已完成。新的数据看板是否需要单独录制视频？高级 API 部分是否对所有客户开放？', time: '09:05' },
        ],
      },
      {
        id: 'task-support-weekly',
        title: '客户技术支持周报',
        description: '汇总本周技术支持工单，分析高频问题并提出产品改进建议。',
        status: 'pending',
        columnId: 'col-training',
        workspace: 'tech-support',
        assistant: '数据分析助手',
        tags: ['支持', '周报'],
        updatedAt: '2 小时前',
        messages: [{ from: 'user', text: '把这周的支持工单整理成周报。', time: '09:20' }],
      },
    ],
  },
}

export const boardSummaries: BoardSummary[] = Object.values(boards).map((board) => ({
  id: board.id,
  title: board.title,
  english: board.english,
  icon: board.icon,
  tone: board.tone,
  taskCount: board.tasks.length,
}))

export function countStatus(tasks: BoardTask[], status: BoardFilter): number {
  if (status === 'all') return tasks.length
  return tasks.filter((task) => task.status === status).length
}

export function filterTasks(tasks: BoardTask[], status: BoardFilter, query: string): BoardTask[] {
  const needle = query.trim().toLowerCase()
  return tasks.filter((task) => {
    if (status !== 'all' && task.status !== status) return false
    if (!needle) return true
    return `${task.title} ${task.description} ${task.workspace} ${task.assistant} ${task.tags.join(' ')}`
      .toLowerCase()
      .includes(needle)
  })
}
