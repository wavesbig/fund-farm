'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check } from 'lucide-react';
import ScanButton from './ScanButton';
import { Button } from '@/components/ui/button';

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
      <form className="form flex items-center gap-2" onSubmit={addFund}>
        <div className="search-input-wrapper flex-1 flex items-center gap-2 flex-wrap relative">
          <span className="navbar-search-icon" aria-hidden="true">
            <Search className="w-4 h-4 text-muted-foreground" />
          </span>
          <div className="input navbar-input-shell flex items-center flex-1">
            <input
              ref={inputRef}
              className="navbar-input-field flex-1 bg-transparent border-0 outline-none text-[16PX] md:text-sm text-foreground placeholder:text-muted-foreground"
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
            <div className="mr-2 flex items-center">
              <ScanButton onClick={handleScanClick} disabled={isScanning} />
            </div>
          </div>
          {isSearching && <div className="search-spinner" />}
        </div>
        <Button
          type="submit"
          onMouseDown={(e) => e.preventDefault()}
          className={`h-9 px-4 font-medium transition-all ${
            isSearchFocused || selectedFunds.length > 0 ? 'inline-flex' : 'hidden md:inline-flex'
          }`}
        >
          添加
        </Button>
      </form>

      <AnimatePresence>
        {showDropdown && (String(searchTerm ?? '').trim() || searchResults.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="search-dropdown glass scrollbar-y-styled"
          >
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
            ) : String(searchTerm ?? '').trim() && !isSearching ? (
              <div className="no-results text-center py-6 text-xs text-muted-foreground">未找到相关基金</div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
