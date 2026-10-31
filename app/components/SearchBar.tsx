'use client';

import * as React from 'react';
import { Search, Check } from 'lucide-react';
import ScanButton from './ScanButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
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
  isSearchFocused,
  setIsSearchFocused,
  searchResults,
  isSearching,
  selectedFunds,
  toggleSelectFund,
  isScanning,
  handleScanClick,
  addFund
}: SearchBarProps) {
  return (
    <>
      <form className="form flex items-center gap-2 w-full" onSubmit={addFund}>
        <div className="relative flex-1 flex items-center min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10 opacity-70" />
          <Input
            ref={inputRef}
            className="h-[38px] w-full rounded-lg pl-10 pr-12 text-[16PX] md:text-sm bg-card border-border shadow-[0_1px_2px_rgba(50,50,93,0.06),0_1px_1px_rgba(0,0,0,0.04)] text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
            placeholder="搜索基金名称或代码..."
            value={searchTerm}
            onChange={handleSearchInput}
            onFocus={() => {
              setShowDropdown(true);
              setIsSearchFocused(true);
            }}
            onBlur={() => {
              // 延迟关闭，以允许点击搜索结果
              setTimeout(() => setIsSearchFocused(false), 200);
            }}
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
            {isSearching && (
              <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-0.5" />
            )}
            <ScanButton onClick={handleScanClick} disabled={isScanning} />
          </div>
        </div>
        <Button
          type="submit"
          onMouseDown={(e) => e.preventDefault()}
          className="h-[38px] px-4 font-medium rounded-md shrink-0 hidden sm:inline-flex shadow-sm transition-colors"
        >
          添加
        </Button>
      </form>

      {showDropdown && (String(searchTerm ?? '').trim() || searchResults.length > 0) && (
        <div className="search-dropdown glass scrollbar-y-styled">
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
