import { createContext } from 'react';

export interface EditModeContextType {
  isEditMode: boolean;
  selectedCodes: Set<string> | null;
  toggleSelected: ((code: string, checked: boolean) => void) | null;
}

export const EditModeContext = createContext<EditModeContextType>({
  isEditMode: false,
  selectedCodes: null,
  toggleSelected: null
});

export interface SortableRowContextType {
  setActivatorNodeRef: ((element: HTMLElement | null) => void) | null;
  listeners: any;
  activatorProps: any;
}

export const SortableRowContext = createContext<SortableRowContextType>({
  setActivatorNodeRef: null,
  listeners: null,
  activatorProps: null
});

export const NON_FROZEN_COLUMN_IDS = [
  'dataSource',
  'relatedSector',
  'yesterdayChangePercent',
  'estimateChangePercent',
  'sinceAddedChangePercent',
  'todayProfit',
  'totalChangePercent',
  'yesterdayProfit',
  'holdingProfit',
  'latestNav',
  'holdingDays',
  'period1w',
  'period1m',
  'period3m',
  'period6m',
  'period1y',
  'holdingAmount',
  'holdingRatio',
  'holdingCost',
  'costNav',
  'estimateNav'
];

/** 已保存列显示偏好时，新增列默认隐藏；未保存时随「全展示」 */
export const PC_COLUMNS_DEFAULT_HIDDEN_IF_PERSONALIZED = new Set([
  'dataSource',
  'holdingCost',
  'costNav',
  'sinceAddedChangePercent',
  'holdingRatio'
]);

export const COLUMN_HEADERS: Record<string, string> = {
  dataSource: '数据源',
  relatedSector: '关联板块',
  period1w: '近1周',
  period1m: '近1月',
  period3m: '近3月',
  period6m: '近6月',
  period1y: '近1年',
  latestNav: '最新净值',
  estimateNav: '估算净值',
  yesterdayChangePercent: '最新涨幅',
  estimateChangePercent: '估算涨幅',
  sinceAddedChangePercent: '自添加来',
  totalChangePercent: '估算收益',
  holdingAmount: '持仓金额',
  holdingRatio: '持仓占比',
  holdingCost: '持仓成本',
  costNav: '成本净值',
  holdingDays: '持有天数',
  todayProfit: '当日收益',
  yesterdayProfit: '昨日收益',
  holdingProfit: '持有收益'
};

/** dnd-kit sortable 会给节点 tabIndex=0，拖拽聚焦时浏览器会把页面滚到该元素 */
export function sortableRowA11yProps(attributes: any) {
  if (!attributes) return {};
  const { tabIndex: _ignored, ...rest } = attributes;
  return { ...rest, tabIndex: -1 };
}

export interface PcFundTableProps {
  data?: any[];
  onRemoveFund?: (fund: any) => void;
  onRemoveFunds?: (codes: string[]) => boolean | void;
  onMoveFunds?: (payload: any) => Promise<any> | void;
  currentTab?: string;
  groups?: any[];
  favorites?: Set<string>;
  onToggleFavorite?: (code: string) => void;
  onHoldingAmountClick?: (row: any, meta: { hasHolding: boolean }) => void;
  onHoldingProfitClick?: (row: any) => void;
  sortBy?: string;
  sortOrder?: string;
  sortRules?: any[];
  onSortChange?: (field: string) => void;
  onReorder?: (oldIndex: number, newIndex: number) => void;
  onCustomSettingsChange?: () => void;
  getFundCardProps?: (row: any) => any;
  closeDialogRef?: React.MutableRefObject<any>;
  batchSelectionClearRef?: React.MutableRefObject<(() => void) | null>;
  stickyTop?: number;
  masked?: boolean;
  relatedSectorSessionKey?: string;
  onFundTagsClick?: (row: any) => void;
  fundExtraDataByCode?: Record<string, any>;
}

export interface FundNameCellProps {
  info: any;
  showFullFundName?: boolean;
  onOpenCardDialog?: (row: any) => void;
  favorites?: Set<string>;
  isGroupTab?: boolean;
  currentTab?: string;
  batchRemoveEnabled?: boolean;
  sortBy?: string;
  onToggleFavoriteRef?: React.MutableRefObject<any>;
  onFundTagsClickRef?: React.MutableRefObject<any>;
  canEditFundTags?: boolean;
  fundExtraDataByCode?: Record<string, any>;
}
