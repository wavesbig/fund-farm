'use client';

import * as React from 'react';
import { Search, Check, X, CornerDownLeft, Sparkles, Camera } from 'lucide-react';
import ScanButton from './ScanButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/app/hooks/useIsMobile';

export interface FundSearchResult {
  CODE: string;
  NAME: string;
  TYPE?: string;
  [key: string]: any;
}

export interface SearchBarProps {
  inputRef?: React.RefObject<HTMLInputElement | null>;
  searchTerm: string;
  handleSearchInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  searchResults: FundSearchResult[];
  isSearching: boolean;
  selectedFunds: FundSearchResult[];
  toggleSelectFund: (fund: FundSearchResult) => void;
  isScanning: boolean;
  handleScanClick: () => void;
  addFund: (e?: any) => void;
}

export default function SearchBar({
  inputRef,
  searchTerm,
  handleSearchInput,
  showDropdown,
  setShowDropdown,
  searchResults,
  isSearching,
  selectedFunds,
  toggleSelectFund,
  isScanning,
  handleScanClick,
  addFund
}: SearchBarProps) {
  const cleanTerm = String(searchTerm ?? '').trim();
  const hasValue = Boolean(cleanTerm);
  const isSixDigitCode = /^\d{6}$/.test(cleanTerm);
  const isMobile = useIsMobile();
  const [isMac, setIsMac] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || navigator.platform || ''));
    }
  }, []);

  // 全局快捷键唤醒：Ctrl+K / ⌘K 或 / 键
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef?.current?.focus();
        setShowDropdown(true);
      } else if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        inputRef?.current?.focus();
        setShowDropdown(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [inputRef, setShowDropdown]);

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleSearchInput({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
      inputRef?.current?.focus();
    },
    [handleSearchInput, inputRef]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
        inputRef?.current?.blur();
      }
    },
    [setShowDropdown, inputRef]
  );

  const handleClearAllSelected = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      selectedFunds.forEach((f) => toggleSelectFund(f));
    },
    [selectedFunds, toggleSelectFund]
  );

  return (
    <>
      <form className="form flex items-center gap-2 w-full" onSubmit={addFund}>
        <div className="relative flex-1 flex items-center min-w-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70 pointer-events-none z-10"
            strokeWidth={1.8}
          />
          <Input
            ref={inputRef}
            className={cn(
              'h-[38px] w-full rounded-lg pl-9 text-[16PX] md:text-sm bg-card border-border shadow-[0_1px_2px_rgba(50,50,93,0.06),0_1px_1px_rgba(0,0,0,0.04)] text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-[border-color,box-shadow,background-color] duration-150 ease-out',
              hasValue ? 'pr-9 sm:pr-11' : 'pr-10 lg:pr-20'
            )}
            placeholder={isMobile ? '搜索基金代码/名称' : '搜索代码、名称...'}
            value={searchTerm}
            onChange={handleSearchInput}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
          />

          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
            {/* 未输入状态：展示 ⌘K 快捷键提示 + 拍照识图入口（宽敞不拥挤） */}
            {!hasValue && (
              <>
                {!isSearching && (
                  <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground/60 bg-muted/40 rounded border border-border/50 pointer-events-none select-none">
                    {isMac ? '⌘K' : 'Ctrl K'}
                  </kbd>
                )}
                <ScanButton onClick={handleScanClick} disabled={isScanning} />
              </>
            )}

            {/* 输入状态：相机按钮让位，仅展示加载状态与独立清空按钮，彻底根除误触 */}
            {hasValue && (
              <div className="flex items-center gap-1">
                {isSearching && (
                  <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-0.5" />
                )}
                <button
                  type="button"
                  onClick={handleClear}
                  className="size-6 rounded-md flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all cursor-pointer"
                  aria-label="清空输入"
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 智能添加按钮：未输入且未勾选时呈现禁用态，输入有效6位代码时提示 ⏎ 回车快速添加 */}
        <Button
          type="submit"
          disabled={!hasValue && selectedFunds.length === 0}
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            'h-[38px] px-3.5 font-medium rounded-lg shrink-0 hidden md:inline-flex transition-all duration-150 ease-out cursor-pointer shadow-xs',
            !hasValue && selectedFunds.length === 0
              ? 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground border border-border shadow-none'
              : 'active:scale-95'
          )}
        >
          {selectedFunds.length > 0 ? (
            <span className="flex items-center gap-1.5">
              <span>添加</span>
              <span className="inline-flex items-center justify-center size-4.5 rounded-full bg-primary-foreground/20 text-xs font-semibold tabular-nums">
                {selectedFunds.length}
              </span>
            </span>
          ) : isSixDigitCode ? (
            <span className="flex items-center gap-1">
              <span>添加</span>
              <CornerDownLeft className="size-3.5 opacity-80" />
            </span>
          ) : (
            '添加'
          )}
        </Button>
      </form>

      {showDropdown && (cleanTerm || searchResults.length > 0 || selectedFunds.length > 0) && (
        <div className="search-dropdown glass scrollbar-y-styled">
          {/* 选中的多只基金浮动控制栏（留在下拉层内，保证 Header 尺寸恒定） */}
          {selectedFunds.length > 0 && (
            <div className="p-2.5 border-b border-border/60 bg-primary/5 flex items-center justify-between text-xs sticky top-0 z-20 backdrop-blur-md rounded-t-lg">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-muted-foreground">已选中</span>
                <span className="font-semibold text-primary tabular-nums">{selectedFunds.length}</span>
                <span className="text-muted-foreground">只基金</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllSelected}
                  className="h-6.5 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md transition-colors cursor-pointer"
                >
                  清空已选
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addFund(e);
                  }}
                  className="h-6.5 px-3 text-xs rounded-md shadow-xs cursor-pointer font-medium"
                >
                  批量添加 ({selectedFunds.length})
                </Button>
              </div>
            </div>
          )}

          {searchResults.length > 0 ? (
            <>
              <div className="search-results">
                {searchResults.map((fund) => {
                  const isSelected = selectedFunds.some((f) => f.CODE === fund.CODE);
                  return (
                    <div
                      key={fund.CODE}
                      className={`search-item flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'selected bg-primary/10' : 'hover:bg-white/5'
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        toggleSelectFund(fund);
                      }}
                    >
                      <div className="fund-info min-w-0">
                        <span className="fund-name font-medium block truncate text-foreground text-sm">
                          {fund.NAME}
                        </span>
                        <span className="fund-code text-xs text-muted-foreground tabular-nums">
                          #{fund.CODE} {fund.TYPE ? `| ${fund.TYPE}` : ''}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ml-3 ${
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 搜索列表底部常驻指引：告知用户直接按 Ctrl+V 粘贴截图识图 */}
              <div className="p-2 px-3 border-t border-border/40 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground select-none">
                <span className="flex items-center gap-1.5 truncate">
                  <Sparkles className="size-3 text-primary shrink-0" />
                  <span className="truncate">支持直接按 Ctrl+V 粘贴持仓截图</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDropdown(false);
                    handleScanClick();
                  }}
                  className="text-primary hover:text-primary/80 font-medium flex items-center gap-1 shrink-0 cursor-pointer transition-colors ml-2"
                >
                  <Camera className="size-3" />
                  <span>识图导入</span>
                </button>
              </div>
            </>
          ) : cleanTerm && !isSearching ? (
            <div className="no-results text-center py-6 px-4">
              <p className="text-xs text-muted-foreground mb-3">未找到与“{searchTerm}”相关的基金</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDropdown(false);
                  handleScanClick();
                }}
                className="h-7.5 px-3 text-xs gap-1.5 rounded-lg border-border hover:border-primary/40 text-primary hover:text-primary transition-all cursor-pointer shadow-2xs"
              >
                <Camera className="size-3.5" />
                <span>尝试截图/拍照智能识别导入</span>
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
