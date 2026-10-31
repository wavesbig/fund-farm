/**
 * 基金核心业务实体类型定义
 */

export interface Fund {
  /** 基金 6 位代码，如 "000001" */
  code: string;
  /** 基金名称 */
  name: string;
  /** 最新公布的单位净值，如 "1.2345" */
  dwjz?: string | number | null;
  /** 上一个交易日的单位净值 */
  lastNav?: string | number | null;
  /** 当前交易日实时估算净值 */
  gsz?: number | string | null;
  /** 估算涨跌幅（百分比数值，如 1.23 表示 +1.23%） */
  gszzl?: number | string | null;
  /** 净值日期（格式: "YYYY-MM-DD"） */
  jzrq?: string | null;
  /** 估值时间（格式: "YYYY-MM-DD HH:mm"） */
  gztime?: string | null;
  /** 净值涨跌幅（昨日/最新公布日单位净值实际涨跌幅，百分比数值） */
  zzl?: number | string | null;
  /** 昨日（再前一交易日）实际涨跌幅 */
  yesterdayZzl?: number | null;
  /** 昨日（再前一交易日）单位净值变动净额 */
  yesterdayNavDelta?: number | null;
  /** 是否无估值数据（true 时界面不展示实时估算） */
  noValuation?: boolean;
  /** 估值数据来源标识（如 'fundgz', 'sina_ds2', 'sina_ds3'） */
  valuationSource?: string | null;
  /** 估值数据源编号（1=天天基金，2=新浪基金口径一，3=新浪基金口径二） */
  dataSource?: number;
  /** 是否自动匹配最优数据源 */
  autoSource?: boolean;
  /** 基金添加时间戳（毫秒数） */
  addedAt?: number | null;
  /** 基金添加时的基准净值（用于计算“自添加来”收益率） */
  addBaseNav?: number | null;
  /** 基金添加时的基准净值日期 */
  addBaseDate?: string | null;
  /** 申购确认所需工作日天数（T+N 中的 N，如 QDII 为 2） */
  confirmDays?: number | null;
  /** 是否在分时图展示外部净值估算图片 */
  showImageChart?: boolean;
  /** 附加的分时时序数据 */
  fundValuationTimeseries?: Record<string, ValuationPoint[]>;
  time?: string | null;
  navUpdatedAt?: string | null;
}

/**
 * 估值分时时序数据点
 */
export interface ValuationPoint {
  time: string;
  gsz?: number | string;
  nav?: number;
  rate?: number;
}

/**
 * 用户持仓信息
 */
export interface Holding {
  /** 持有份额 */
  share: number;
  /** 持仓成本单价 */
  cost: number;
  /** 首次建仓买入日期（格式: "YYYY-MM-DD"） */
  firstPurchaseDate?: string | null;
  /** 申购确认天数覆盖 */
  confirmDays?: number | null;
}

/** 全局持仓字典: { [fundCode]: Holding } */
export type HoldingsMap = Record<string, Holding>;

/** 分组持仓字典: { [groupId]: { [fundCode]: Holding } } */
export type GroupHoldingsMap = Record<string, HoldingsMap>;

/**
 * 基金分组
 */
export interface FundGroup {
  id: string;
  name: string;
  isPreset?: boolean;
  codes: string[];
  pcTableColumnOrder?: string[];
  pcTableColumnVisibility?: Record<string, boolean>;
  pcTableColumnSizing?: Record<string, number>;
  pcTableColumnPinned?: string[];
}

export type Group = FundGroup;

/**
 * 交易记录类型
 */
export type TransactionType = 'buy' | 'sell';

export interface Transaction {
  id: string;
  fundCode: string;
  fundName?: string;
  type: TransactionType;
  share: number;
  amount?: number;
  price?: number;
  nav?: number;
  cost?: number;
  date: string;
  feeRate?: number;
  feeMode?: string;
  feeValue?: number;
  isAfter3pm?: boolean;
  isDca?: boolean;
  timestamp?: number;
  groupId?: string | null;
  isHistoryOnly?: boolean;
}

/**
 * 待处理交易单（净值公布前暂存的交易）
 */
export interface PendingTrade {
  id: string;
  fundCode: string;
  fundName?: string;
  type: TransactionType;
  share: number;
  amount: number;
  feeRate?: number;
  feeMode?: string;
  feeValue?: number;
  date: string;
  isAfter3pm?: boolean;
  isDca?: boolean;
  timestamp: number;
  groupId?: string | null;
}

/**
 * 定投计划周期
 */
export type DcaCycle = 'weekly' | 'biweekly' | 'monthly';

export interface DcaPlan {
  code: string;
  enabled: boolean;
  cycle: DcaCycle;
  amount: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  firstDate?: string;
  startDate?: string;
  lastExecutedDate?: string;
  targetGroupId?: string | null;
}

/**
 * 单日收益变更条目
 */
export interface DailyEarningItem {
  date: string;
  earnings: number;
  rate?: number | null;
  baseCostAmount?: number | null;
}

/**
 * 每日收益字典: { [scope: string]: { [fundCode: string]: DailyEarningItem[] } }
 */
export type FundDailyEarningsMap = Record<string, Record<string, DailyEarningItem[]>>;

/**
 * 基金自定义标签记录
 */
export interface FundTagRecord {
  id: string;
  name: string;
  theme?: string;
  fundCodes?: string[];
}

/**
 * 排序规则定义
 */
export interface SortRule {
  id: string;
  label: string;
  name?: string;
  alias?: string;
  enabled?: boolean;
  sortKey?: string;
  order?: 'asc' | 'desc';
}

/**
 * 自定义偏好设置
 */
export interface CustomSettings {
  localSortRules?: SortRule[];
  localSortDisplayMode?: string;
  pcLocalSortDisplayMode?: string;
  mobileLocalSortDisplayMode?: string;
  fundTablePageSize?: number;
  marketIndexSelected?: string[];
  aiConfig?: {
    platform?: string;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  };
  [key: string]: any;
}

/**
 * 持仓计算结果
 */
export interface HoldingProfitResult {
  amount: number;
  cost: number;
  profitTotal: number;
  profitToday: number | null;
  profitRatio: number;
  principalToday: number;
  costNav?: number;
}
