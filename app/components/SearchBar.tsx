'use client';

import * as React from 'react';
import { Search, Check, X } from 'lucide-react';
import ScanButton from './ScanButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  const hasValue = Boolean(String(searchTerm ?? '').trim());
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10 opacity-70" />
          <Input
            ref={inputRef}
            className={cn(
              'h-[38px] w-full rounded-lg pl-9 text-[16PX] md:text-sm bg-card border-border shadow-[0_1px_2px_rgba(50,50,93,0.06),0_1px_1px_rgba(0,0,0,0.04)] text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-[border-color,box-shadow,background-color] duration-150 ease-out',
              hasValue ? 'pr-16' : 'pr-20'
            )}
            placeholder="搜索基金名称或代码..."
            value={searchTerm}
            onChange={handleSearchInput}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
            {!hasValue && !isSearching && (
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground/60 bg-muted/40 rounded border border-border/50 pointer-events-none select-none">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            )}
            {hasValue && (
              <button
                type="button"
                onClick={handleClear}
                className="size-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.08] [data-theme=light]:hover:bg-black/[0.06] transition-colors cursor-pointer"
                aria-label="清空输入"
              >
                <X className="size-3.5" />
              </button>
            )}
            {isSearching && (
              <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-0.5" />
            )}
            <ScanButton onClick={handleScanClick} disabled={isScanning} />
          </div>
        </div>
        <Button
          type="submit"
          onMouseDown={(e) => e.preventDefault()}
          className="h-[38px] px-3.5 font-medium rounded-lg shrink-0 hidden md:inline-flex shadow-sm transition-colors cursor-pointer"
        >
          {selectedFunds.length > 0 ? `添加 (${selectedFunds.length})` : '添加'}
        </Button>
      </form>

      {showDropdown && (String(searchTerm ?? '').trim() || searchResults.length > 0 || selectedFunds.length > 0) && (
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
                <button
                  type="button"
                  onClick={handleClearAllSelected}
                  className="text-muted-foreground hover:text-foreground text-[11px] underline cursor-pointer"
                >
                  清空已选
                </button>
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
                      <span className="fund-name font-medium block truncate text-foreground text-sm">{fund.NAME}</span>
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
          ) : String(searchTerm ?? '').trim() && !isSearching ? (
            <div className="no-results text-center py-6 text-xs text-muted-foreground">未找到相关基金</div>
          ) : null}
        </div>
      )}
    </>
  );
}
