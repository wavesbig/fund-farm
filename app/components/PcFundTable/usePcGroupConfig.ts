'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { isArray, isObject, isFunction, debounce } from 'lodash';
import { storageStore } from '@/app/stores';
import { NON_FROZEN_COLUMN_IDS, PC_COLUMNS_DEFAULT_HIDDEN_IF_PERSONALIZED } from './types';

export interface UsePcGroupConfigOptions {
  groupKey: string;
  groups?: any[];
  onCustomSettingsChange?: () => void;
}

export function usePcGroupConfig({ groupKey, groups = [], onCustomSettingsChange }: UsePcGroupConfigOptions) {
  const currentGroupName = useMemo(() => {
    if (groupKey === 'all') return '全部';
    if (groupKey === 'fav') return '自选';
    return (isArray(groups) ? groups : []).find((g) => g?.id === groupKey)?.name || '当前';
  }, [groupKey, groups]);

  const settingSyncOptions = useMemo(() => {
    const baseOptions = [
      { id: 'all', name: '全部', description: '全部分组' },
      { id: 'fav', name: '自选', description: '自选分组' },
      ...(isArray(groups) ? groups : []).map((group) => ({
        id: group?.id,
        name: group?.name || '未命名',
        description: '自定义分组'
      }))
    ];
    const seen = new Set();
    return baseOptions.filter((item) => {
      const id = String(item?.id ?? '').trim();
      if (!id || id === groupKey || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [groupKey, groups]);

  const getCustomSettingsWithMigration = (): Record<string, any> => {
    if (typeof window === 'undefined') return {};
    try {
      const parsed: Record<string, any> = storageStore.getItem('customSettings') || {};
      if (!parsed || !isObject(parsed)) return {};
      if (
        parsed.pcTableColumnOrder != null ||
        parsed.pcTableColumnVisibility != null ||
        parsed.pcTableColumns != null ||
        parsed.mobileTableColumnOrder != null ||
        parsed.mobileTableColumnVisibility != null
      ) {
        const all = {
          ...(parsed.all && isObject(parsed.all) ? parsed.all : {}),
          pcTableColumnOrder: parsed.pcTableColumnOrder,
          pcTableColumnVisibility: parsed.pcTableColumnVisibility,
          pcTableColumns: parsed.pcTableColumns,
          mobileTableColumnOrder: parsed.mobileTableColumnOrder,
          mobileTableColumnVisibility: parsed.mobileTableColumnVisibility
        };
        delete parsed.pcTableColumnOrder;
        delete parsed.pcTableColumnVisibility;
        delete parsed.pcTableColumns;
        delete parsed.mobileTableColumnOrder;
        delete parsed.mobileTableColumnVisibility;
        parsed.all = all;
        storageStore.setItem('customSettings', JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return {};
    }
  };

  const buildPcConfigFromGroup = (group: any) => {
    if (!group || !isObject(group)) return null;
    const g = group as Record<string, any>;
    const sizing = g.pcTableColumns;
    const sizingObj: Record<string, any> =
      sizing && isObject(sizing)
        ? Object.fromEntries(Object.entries(sizing).filter(([, v]) => Number.isFinite(v)))
        : {};
    if (sizingObj.actions) {
      const { actions, ...rest } = sizingObj;
      Object.assign(sizingObj, rest);
      delete sizingObj.actions;
    }
    const order = isArray(g.pcTableColumnOrder) && g.pcTableColumnOrder.length > 0 ? g.pcTableColumnOrder : null;
    const visibility =
      g.pcTableColumnVisibility && isObject(g.pcTableColumnVisibility) ? g.pcTableColumnVisibility : null;
    const pinned = isArray(g.pcTableColumnPinned) ? g.pcTableColumnPinned : [];
    return { sizing: sizingObj, order, visibility, pinned };
  };

  const getDefaultPcGroupConfig = () => ({
    order: [...NON_FROZEN_COLUMN_IDS],
    visibility: null,
    sizing: {},
    pinned: []
  });

  const getInitialConfigByGroup = () => {
    const parsed: Record<string, any> = getCustomSettingsWithMigration();
    const byGroup: Record<string, any> = {};
    Object.keys(parsed).forEach((k) => {
      if (k === 'pcContainerWidth') return;
      const group = parsed[k];
      const pc = buildPcConfigFromGroup(group);
      if (pc) {
        byGroup[k] = {
          pcTableColumnOrder: pc.order
            ? (() => {
                const valid = pc.order.filter((id: string) => NON_FROZEN_COLUMN_IDS.includes(id));
                const missing = NON_FROZEN_COLUMN_IDS.filter((id: string) => !valid.includes(id));
                return [...valid, ...missing];
              })()
            : null,
          pcTableColumnVisibility: pc.visibility,
          pcTableColumns: Object.keys(pc.sizing).length ? pc.sizing : null,
          pcShowFullFundName: group.pcShowFullFundName === true,
          pcTableColumnPinned: pc.pinned
        };
      }
    });
    return byGroup;
  };

  const [configByGroup, setConfigByGroup] = useState<Record<string, any>>(getInitialConfigByGroup);

  const currentGroupPc = configByGroup[groupKey];
  const showFullFundName = currentGroupPc?.pcShowFullFundName ?? false;
  const defaultPc = getDefaultPcGroupConfig();

  const columnOrder = useMemo(() => {
    const order = currentGroupPc?.pcTableColumnOrder ?? defaultPc.order;
    if (!isArray(order) || order.length === 0) return [...NON_FROZEN_COLUMN_IDS];
    const valid = order.filter((id: string) => NON_FROZEN_COLUMN_IDS.includes(id));
    const missing = NON_FROZEN_COLUMN_IDS.filter((id: string) => !valid.includes(id));
    return [...valid, ...missing];
  }, [currentGroupPc?.pcTableColumnOrder, defaultPc.order]);

  const columnVisibility: Record<string, boolean> = useMemo(() => {
    const vis = currentGroupPc?.pcTableColumnVisibility ?? null;
    if (vis && isObject(vis) && Object.keys(vis).length > 0) {
      const next: Record<string, boolean> = { ...vis };
      NON_FROZEN_COLUMN_IDS.forEach((id) => {
        if (next[id] === undefined) {
          next[id] = PC_COLUMNS_DEFAULT_HIDDEN_IF_PERSONALIZED.has(id) ? false : true;
        }
      });
      return next;
    }
    const allVisible: Record<string, boolean> = {};
    NON_FROZEN_COLUMN_IDS.forEach((id) => {
      allVisible[id] = PC_COLUMNS_DEFAULT_HIDDEN_IF_PERSONALIZED.has(id) ? false : true;
    });
    return allVisible;
  }, [currentGroupPc?.pcTableColumnVisibility]);

  const columnSizing: Record<string, number> = useMemo(() => {
    const s = currentGroupPc?.pcTableColumns;
    if (s && isObject(s)) {
      const out = Object.fromEntries(Object.entries(s).filter(([, v]) => Number.isFinite(v)));
      if (out.actions) {
        const { actions, ...rest } = out;
        return rest;
      }
      return out;
    }
    return {};
  }, [currentGroupPc?.pcTableColumns]);

  const persistPcGroupConfig = useCallback(
    (updates: any) => {
      if (typeof window === 'undefined') return;
      try {
        const parsed: Record<string, any> = storageStore.getItem('customSettings') || {};
        const group: Record<string, any> =
          parsed[groupKey] && isObject(parsed[groupKey]) ? { ...parsed[groupKey] } : {};
        if (updates.pcTableColumnOrder !== undefined) group.pcTableColumnOrder = updates.pcTableColumnOrder;
        if (updates.pcTableColumnVisibility !== undefined)
          group.pcTableColumnVisibility = updates.pcTableColumnVisibility;
        if (updates.pcTableColumns !== undefined) group.pcTableColumns = updates.pcTableColumns;
        if (updates.pcTableColumnPinned !== undefined) group.pcTableColumnPinned = updates.pcTableColumnPinned;
        if (updates.pcShowFullFundName !== undefined) group.pcShowFullFundName = updates.pcShowFullFundName;
        parsed[groupKey] = group;
        storageStore.setItem('customSettings', JSON.stringify(parsed));
        setConfigByGroup((prev) => ({ ...prev, [groupKey]: { ...prev[groupKey], ...updates } }));
        onCustomSettingsChange?.();
      } catch {}
    },
    [groupKey, onCustomSettingsChange]
  );

  const handleToggleShowFullFundName = (show: boolean) => {
    persistPcGroupConfig({ pcShowFullFundName: show });
  };

  const handleSyncPcSettings = (targetIds: string[] = []) => {
    if (!targetIds.length || typeof window === 'undefined') return false;
    try {
      const parsed = storageStore.getItem('customSettings') || {};
      const payload = {
        pcTableColumnOrder: [...columnOrder],
        pcTableColumnVisibility: { ...columnVisibility },
        pcTableColumns: { ...columnSizing },
        pcTableColumnPinned: [...(currentGroupPc?.pcTableColumnPinned || [])],
        pcShowFullFundName: !!showFullFundName
      };
      const targetUpdates: Record<string, any> = {};
      targetIds.forEach((targetId) => {
        if (!targetId || targetId === groupKey) return;
        const group = parsed[targetId] && isObject(parsed[targetId]) ? { ...parsed[targetId] } : {};
        parsed[targetId] = { ...group, ...payload };
        targetUpdates[targetId] = payload;
      });
      const syncedCount = Object.keys(targetUpdates).length;
      if (syncedCount === 0) return false;
      storageStore.setItem('customSettings', JSON.stringify(parsed));
      setConfigByGroup((prev) => {
        const next = { ...prev };
        Object.entries(targetUpdates).forEach(([targetId, updates]) => {
          next[targetId] = { ...(next[targetId] || {}), ...(updates as object) };
        });
        return next;
      });
      onCustomSettingsChange?.();
      return syncedCount;
    } catch {
      return false;
    }
  };

  const setColumnOrder = (nextOrderOrUpdater: any) => {
    const next = isFunction(nextOrderOrUpdater) ? nextOrderOrUpdater(columnOrder) : nextOrderOrUpdater;
    persistPcGroupConfig({ pcTableColumnOrder: next });
  };

  const setColumnVisibility = (nextOrUpdater: any) => {
    const next = isFunction(nextOrUpdater) ? nextOrUpdater(columnVisibility) : nextOrUpdater;
    persistPcGroupConfig({ pcTableColumnVisibility: next });
  };

  const [localColumnSizing, setLocalColumnSizing] = useState(columnSizing);

  useEffect(() => {
    setLocalColumnSizing(columnSizing);
  }, [columnSizing]);

  const debouncedPersistColumnSizing = useMemo(
    () =>
      debounce((sizes: any) => {
        persistPcGroupConfig({ pcTableColumns: sizes });
      }, 300),
    [persistPcGroupConfig]
  );

  useEffect(() => {
    return () => {
      debouncedPersistColumnSizing.cancel();
    };
  }, [debouncedPersistColumnSizing]);

  const setColumnSizing = (nextOrUpdater: any) => {
    setLocalColumnSizing((prev) => {
      const next = isFunction(nextOrUpdater) ? nextOrUpdater(prev) : nextOrUpdater;
      const { actions, ...rest } = next || {};
      const newSizes = rest || {};
      debouncedPersistColumnSizing(newSizes);
      return newSizes;
    });
  };

  const handleResetSizing = () => {
    setColumnSizing({});
  };

  const handleResetColumnOrder = () => {
    setColumnOrder([...NON_FROZEN_COLUMN_IDS]);
  };

  const handleResetColumnVisibility = () => {
    const allVisible: Record<string, boolean> = {};
    NON_FROZEN_COLUMN_IDS.forEach((id) => {
      allVisible[id] = PC_COLUMNS_DEFAULT_HIDDEN_IF_PERSONALIZED.has(id) ? false : true;
    });
    setColumnVisibility(allVisible);
  };

  const handleToggleColumnVisibility = (columnId: string, visible: boolean) => {
    setColumnVisibility((prev: Record<string, boolean> = {}) => ({ ...prev, [columnId]: visible }));
  };

  const handleTogglePinColumn = (id: string) => {
    const currentPinned: string[] = currentGroupPc?.pcTableColumnPinned || [];
    let nextPinned: string[];
    let nextOrder: string[];

    if (currentPinned.includes(id)) {
      nextPinned = currentPinned.filter((c) => c !== id);
      const pinnedPart = columnOrder.filter((c) => nextPinned.includes(c));
      const unpinnedPart = columnOrder.filter((c) => !nextPinned.includes(c));
      nextOrder = [...pinnedPart, ...unpinnedPart];
    } else {
      nextPinned = [...currentPinned, id];
      const existingPinned = columnOrder.filter((c) => currentPinned.includes(c));
      const existingUnpinnedWithoutId = columnOrder.filter((c) => !currentPinned.includes(c) && c !== id);
      nextOrder = [...existingPinned, id, ...existingUnpinnedWithoutId];
    }

    persistPcGroupConfig({
      pcTableColumnPinned: nextPinned,
      pcTableColumnOrder: nextOrder
    });
  };

  return {
    currentGroupName,
    settingSyncOptions,
    currentGroupPc,
    showFullFundName,
    columnOrder,
    columnVisibility,
    columnSizing: localColumnSizing,
    setColumnOrder,
    setColumnVisibility,
    setColumnSizing,
    handleToggleShowFullFundName,
    handleSyncPcSettings,
    handleResetSizing,
    handleResetColumnOrder,
    handleResetColumnVisibility,
    handleToggleColumnVisibility,
    handleTogglePinColumn
  };
}
