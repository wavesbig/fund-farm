import { isBoolean, isFunction, isObject } from 'lodash';
import { create } from 'zustand';

type ValueOrUpdater<T> = T | ((prev: T) => T);

export type FontSizeLevel = 'standard' | 'comfortable' | 'large' | 'extra-large';

export interface SettingsStoreState {
  tempSeconds: number;
  containerWidth: number;
  fontSizeLevel: FontSizeLevel;
  showMarketIndexPc: boolean;
  showMarketIndexMobile: boolean;
  showGroupFundSearchPc: boolean;
  showGroupFundSearchMobile: boolean;
  dynamicStylePc: boolean;
  dynamicStyleMobile: boolean;
  showGroupDropdownPc: boolean;
  showGroupDropdownMobile: boolean;
  isGroupSummarySticky: boolean;

  setTempSeconds: (val: ValueOrUpdater<number>) => void;
  setContainerWidth: (val: ValueOrUpdater<number>) => void;
  setFontSizeLevel: (val: ValueOrUpdater<FontSizeLevel>) => void;
  setShowMarketIndexPc: (val: ValueOrUpdater<boolean>) => void;
  setShowMarketIndexMobile: (val: ValueOrUpdater<boolean>) => void;
  setShowGroupFundSearchPc: (val: ValueOrUpdater<boolean>) => void;
  setShowGroupFundSearchMobile: (val: ValueOrUpdater<boolean>) => void;
  setDynamicStylePc: (val: ValueOrUpdater<boolean>) => void;
  setDynamicStyleMobile: (val: ValueOrUpdater<boolean>) => void;
  setShowGroupDropdownPc: (val: ValueOrUpdater<boolean>) => void;
  setShowGroupDropdownMobile: (val: ValueOrUpdater<boolean>) => void;
  setIsGroupSummarySticky: (val: ValueOrUpdater<boolean>) => void;

  /**
   * 从 customSettings 解析并同步配置到 Zustand 状态
   */
  syncFromCustomSettings: (customSettings: unknown) => void;
}

/**
 * 本地配置状态 Zustand Store
 */
export const useSettingsStore = create<SettingsStoreState>((set) => ({
  tempSeconds: 60,
  containerWidth: 1200,
  fontSizeLevel: 'comfortable',
  showMarketIndexPc: true,
  showMarketIndexMobile: true,
  showGroupFundSearchPc: true,
  showGroupFundSearchMobile: true,
  dynamicStylePc: true,
  dynamicStyleMobile: true,
  showGroupDropdownPc: false,
  showGroupDropdownMobile: false,
  isGroupSummarySticky: false,

  setTempSeconds: (val) => set({ tempSeconds: isFunction(val) ? val(useSettingsStore.getState().tempSeconds) : val }),
  setContainerWidth: (val) =>
    set({ containerWidth: isFunction(val) ? val(useSettingsStore.getState().containerWidth) : val }),
  setFontSizeLevel: (val) => {
    const next = isFunction(val) ? val(useSettingsStore.getState().fontSizeLevel) : val;
    set({ fontSizeLevel: next });
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-font-size', next);
    }
  },
  setShowMarketIndexPc: (val) =>
    set({ showMarketIndexPc: isFunction(val) ? val(useSettingsStore.getState().showMarketIndexPc) : val }),
  setShowMarketIndexMobile: (val) =>
    set({
      showMarketIndexMobile: isFunction(val) ? val(useSettingsStore.getState().showMarketIndexMobile) : val
    }),
  setShowGroupFundSearchPc: (val) =>
    set({
      showGroupFundSearchPc: isFunction(val) ? val(useSettingsStore.getState().showGroupFundSearchPc) : val
    }),
  setShowGroupFundSearchMobile: (val) =>
    set({
      showGroupFundSearchMobile: isFunction(val) ? val(useSettingsStore.getState().showGroupFundSearchMobile) : val
    }),
  setDynamicStylePc: (val) =>
    set({ dynamicStylePc: isFunction(val) ? val(useSettingsStore.getState().dynamicStylePc) : val }),
  setDynamicStyleMobile: (val) =>
    set({ dynamicStyleMobile: isFunction(val) ? val(useSettingsStore.getState().dynamicStyleMobile) : val }),
  setShowGroupDropdownPc: (val) =>
    set({
      showGroupDropdownPc: isFunction(val) ? val(useSettingsStore.getState().showGroupDropdownPc) : val
    }),
  setShowGroupDropdownMobile: (val) =>
    set({
      showGroupDropdownMobile: isFunction(val) ? val(useSettingsStore.getState().showGroupDropdownMobile) : val
    }),
  setIsGroupSummarySticky: (val) =>
    set({
      isGroupSummarySticky: isFunction(val) ? val(useSettingsStore.getState().isGroupSummarySticky) : val
    }),

  syncFromCustomSettings: (customSettings: unknown) => {
    if (!customSettings || !isObject(customSettings)) return;
    try {
      const cs = customSettings as Record<string, unknown>;
      const patch: Partial<SettingsStoreState> = {};
      const w = cs.pcContainerWidth;
      const num = Number(w);
      if (Number.isFinite(num)) {
        const maxWidth =
          typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
            ? 99999
            : typeof window !== 'undefined'
              ? Math.max(window.innerWidth, 2000)
              : 1200;
        patch.containerWidth = Math.min(maxWidth, Math.max(600, num));
      }
      if (isBoolean(cs.showMarketIndexPc)) patch.showMarketIndexPc = cs.showMarketIndexPc;
      if (isBoolean(cs.showMarketIndexMobile)) patch.showMarketIndexMobile = cs.showMarketIndexMobile;
      if (isBoolean(cs.showGroupFundSearchPc)) patch.showGroupFundSearchPc = cs.showGroupFundSearchPc;
      if (isBoolean(cs.showGroupFundSearchMobile)) patch.showGroupFundSearchMobile = cs.showGroupFundSearchMobile;
      if (isBoolean(cs.dynamicStylePc)) patch.dynamicStylePc = cs.dynamicStylePc;
      if (isBoolean(cs.dynamicStyleMobile)) patch.dynamicStyleMobile = cs.dynamicStyleMobile;
      if (isBoolean(cs.showGroupDropdownPc)) patch.showGroupDropdownPc = cs.showGroupDropdownPc;
      if (isBoolean(cs.showGroupDropdownMobile)) patch.showGroupDropdownMobile = cs.showGroupDropdownMobile;
      if (
        cs.fontSizeLevel &&
        ['standard', 'comfortable', 'large', 'extra-large'].includes(cs.fontSizeLevel as string)
      ) {
        patch.fontSizeLevel = cs.fontSizeLevel as FontSizeLevel;
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-font-size', cs.fontSizeLevel as string);
        }
      }

      if (Object.keys(patch).length > 0) {
        set(patch);
      }
    } catch {
      // ignore
    }
  }
}));
