'use client';

import * as React from 'react';
import {
  X,
  Search,
  TrendingUp,
  Wallet,
  CalendarClock,
  FolderKanban,
  Database,
  AlertCircle,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';

export interface TutorialDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SECTIONS = [
  {
    icon: Search,
    title: '1. 添加与搜索基金',
    desc: '在顶部搜索栏输入 6 位数字基金代码（如 110022）或拼音首字母/中文名称进行模糊匹配。支持点击候选直接添加，或勾选多只基金后批量添加至当前视图。'
  },
  {
    icon: TrendingUp,
    title: '2. 实时估值与重仓追踪',
    desc: '盘中实时直连公开行情接口计算单位净值走势，点击基金卡片可展开前 10 大重仓持股及今日涨跌幅。支持在卡片视图与紧凑表格视图（PC/移动端专属定制）间自由切换。'
  },
  {
    icon: Wallet,
    title: '3. 持仓与收益计算',
    desc: '点击基金上的“持仓”按钮即可录入持有份额与持仓成本价。系统将自动结合盘中估算净值计算今日预估收益、持有收益率及累计总盈亏。'
  },
  {
    icon: CalendarClock,
    title: '4. 交易记录与智能定投',
    desc: '支持完整记录买入、卖出与分红流水，方便回溯历史盈亏；可开启周期性自动定投计划（按日/周/月），系统将在交易日自动测算并生成定投标记。'
  },
  {
    icon: FolderKanban,
    title: '5. 多维度分组与自选管理',
    desc: '支持创建自定义分组（如“核心定投”、“稳健固收”、“美股出海”等），独立汇总不同资产组合的收益与资产总值。点击星星图标即可将基金加入“自选”集合。'
  },
  {
    icon: SlidersHorizontal,
    title: '6. 自定义排序与刷新频率',
    desc: '支持自由拖拽卡片排序，或按估值涨跌、持仓收益、持有金额进行多规则组合排序；可在设置中将自动刷新频率自由调整为 5 秒至 300 秒。'
  },
  {
    icon: Database,
    title: '7. 本地实时存储与数据备份',
    desc: '所有持仓与操作数据均秒级自动实时保存至本地 SQLite 数据库中，页面关闭或刷新无缝保留；支持在“系统设置”随时导出完整 JSON 备份文件，迁移无忧。'
  }
];

export default function TutorialDrawer({ open, onOpenChange }: TutorialDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass h-[90vh] max-h-[90vh] flex flex-col">
        <DrawerHeader className="shrink-0 flex flex-row items-center justify-between gap-2 space-y-0 px-5 pb-3.5 pt-4 text-left border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <DrawerTitle className="text-base font-semibold text-foreground">基估宝 · 使用帮助指南</DrawerTitle>
          </div>
          <DrawerClose className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-y-styled space-y-4 max-w-4xl mx-auto w-full">
          {/* 重点说明卡片 */}
          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3 text-xs leading-relaxed text-foreground">
            <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-primary mb-0.5">关于盘中估值精度的说明：</p>
              <p className="text-muted-foreground">
                盘中估值基于基金最新季报披露的重仓股持仓比例及其实时分时走势测算，仅供盘中参考。实际净值以基金公司盘后官方披露为准（通常在交易日
                20:00 - 23:00 更新），非股票型或有盘中调仓的基金可能存在合理偏差。
              </p>
            </div>
          </div>

          {/* 章节网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {SECTIONS.map((sec, idx) => {
              const Icon = sec.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[var(--border)] bg-card/40 backdrop-blur hover:bg-card/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 mb-2 font-medium text-sm text-foreground">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{sec.title}</span>
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">{sec.desc}</p>
                </div>
              );
            })}
          </div>

          {/* 底部提示 */}
          <div className="text-center py-3 text-xs text-[var(--muted)] opacity-75">
            如在使用中有任何改进建议，可随时在主界面底部点击“提交反馈”。
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
