'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  fetchFundPeriodReturns,
  fetchRelatedSectorsBatch,
  fetchFundSecidsBatch,
  fetchEastmoneySectorQuotesBatch
} from '@/app/api/fund';
import { asyncPool } from '@/app/lib/asyncHelper';
import { useDataSourceAccuracyLabels } from '@/app/hooks/useDataSourceAccuracyLabels';

export interface UseFundDataEnhancerOptions {
  data: any[];
  columnVisibility?: Record<string, boolean>;
  relatedSectorSessionKey?: string;
  getFundCardProps?: (row: any) => any;
}

export function useFundDataEnhancer({
  data,
  columnVisibility,
  relatedSectorSessionKey,
  getFundCardProps
}: UseFundDataEnhancerOptions) {
  const relatedSectorEnabled = columnVisibility?.relatedSector !== false;
  const dataSourceEnabled = columnVisibility?.dataSource !== false;
  const dataSourceAccuracyLabels = useDataSourceAccuracyLabels(data, dataSourceEnabled);

  const relatedSectorCacheRef = useRef(new Map());
  const [relatedSectorByCode, setRelatedSectorByCode] = useState<Record<string, string>>({});
  const [sectorQuoteByLabel, setSectorQuoteByLabel] = useState<Record<string, any>>({});

  const sectorAuthSegment = relatedSectorSessionKey || 'anon';
  const dataCodes: string[] = useMemo(
    () => Array.from(new Set((data || []).map((d: any) => d?.code).filter(Boolean))),
    [data]
  );
  const dataCodesKey = useMemo(() => dataCodes.join('|'), [dataCodes]);

  useEffect(() => {
    relatedSectorCacheRef.current.clear();
    setRelatedSectorByCode({});
    setSectorQuoteByLabel({});
  }, [sectorAuthSegment]);

  useEffect(() => {
    if (!relatedSectorEnabled) return;
    if (dataCodes.length === 0) return;

    const missing = dataCodes.filter((code) => !relatedSectorCacheRef.current.has(code));
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const batchResults = await fetchRelatedSectorsBatch(missing, { authSegment: sectorAuthSegment });
        if (cancelled) return;

        Object.entries(batchResults).forEach(([code, value]) => {
          relatedSectorCacheRef.current.set(code, value);
        });

        setRelatedSectorByCode((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const [code, value] of Object.entries(batchResults)) {
            if (next[code] === value) continue;
            next[code] = String(value ?? '');
            changed = true;
          }
          return changed ? next : prev;
        });
      } catch (e) {
        console.error('Fetch related sectors batch error:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [relatedSectorEnabled, dataCodesKey, sectorAuthSegment, dataCodes]);

  useEffect(() => {
    if (!relatedSectorEnabled) return;
    if (dataCodes.length === 0) return;

    const labels = new Set<string>();
    for (const code of dataCodes) {
      const lbl = relatedSectorByCode?.[code] ?? relatedSectorCacheRef.current.get(code);
      const t = lbl != null ? String(lbl).trim() : '';
      if (t) labels.add(t);
    }
    const labelList: string[] = Array.from(labels);
    if (labelList.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const secidResults: Record<string, string> = await fetchFundSecidsBatch(labelList);
        if (cancelled) return;

        const secids = labelList.map((label) => secidResults[label]).filter(Boolean);
        const quotes: Record<string, any> = await fetchEastmoneySectorQuotesBatch(secids);
        const batch: Record<string, any> = {};
        for (const label of labelList) {
          const secid = secidResults[label];
          if (!secid) continue;
          const quote = quotes[secid];
          if (quote) batch[label] = quote;
        }

        if (cancelled) return;
        setSectorQuoteByLabel((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const [label, quote] of Object.entries(batch)) {
            const prevQ = next[label];
            if (prevQ === quote) continue;
            if (prevQ && quote && prevQ.pct === quote.pct && prevQ.name === quote.name && prevQ.code === quote.code) {
              continue;
            }
            next[label] = quote;
            changed = true;
          }
          return changed ? next : prev;
        });
      } catch (e) {
        console.error('Fetch sector quotes batch error:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [relatedSectorEnabled, dataCodesKey, relatedSectorByCode, dataCodes]);

  const withRelatedSectorFund = useCallback(
    (row: any) => {
      if (!row || !row.code) return row;
      const rawValue = relatedSectorByCode?.[row.code] ?? relatedSectorCacheRef.current.get(row.code) ?? '';
      const relatedSector = rawValue != null ? String(rawValue).trim() : '';
      const quote = relatedSector ? sectorQuoteByLabel?.[relatedSector] : null;
      const quoteName = quote?.name != null ? String(quote.name).trim() : '';
      const quotePct = quote?.pct == null ? null : Number(quote.pct);
      const hasQuotePct = quotePct != null && Number.isFinite(quotePct);

      return {
        ...row,
        rawFund: {
          ...(row.rawFund || { code: row.code, name: row.fundName }),
          relatedSector,
          relatedSectorQuoteName: quoteName,
          relatedSectorQuotePct: hasQuotePct ? quotePct : null
        }
      };
    },
    [relatedSectorByCode, sectorQuoteByLabel]
  );

  const getFundCardPropsWithRelatedSector = useCallback(
    (row: any) => {
      if (!getFundCardProps) return {};
      return getFundCardProps(withRelatedSectorFund(row));
    },
    [getFundCardProps, withRelatedSectorFund]
  );

  const periodReturnsEnabled =
    columnVisibility?.period1w !== false ||
    columnVisibility?.period1m !== false ||
    columnVisibility?.period3m !== false ||
    columnVisibility?.period6m !== false ||
    columnVisibility?.period1y !== false;
  const periodReturnsCacheRef = useRef(new Map());
  const [periodReturnsByCode, setPeriodReturnsByCode] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!periodReturnsEnabled) return;
    if (dataCodes.length === 0) return;

    const cachedBatch: Record<string, any> = {};
    for (const code of dataCodes) {
      if (!periodReturnsCacheRef.current.has(code)) continue;
      cachedBatch[code] = periodReturnsCacheRef.current.get(code);
    }
    if (Object.keys(cachedBatch).length > 0) {
      setPeriodReturnsByCode((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [code, value] of Object.entries(cachedBatch)) {
          const prevVal = next[code];
          if (
            prevVal &&
            prevVal.week === value.week &&
            prevVal.month === value.month &&
            prevVal.month3 === value.month3 &&
            prevVal.month6 === value.month6 &&
            prevVal.year1 === value.year1
          ) {
            continue;
          }
          next[code] = value;
          changed = true;
        }
        return changed ? next : prev;
      });
    }

    const missing = dataCodes.filter((code) => !periodReturnsCacheRef.current.has(code));
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      const batchResults: Record<string, any> = {};
      let updateTimeout: any = null;

      const triggerBatchUpdate = () => {
        if (cancelled || Object.keys(batchResults).length === 0) return;
        setPeriodReturnsByCode((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const [c, val] of Object.entries(batchResults)) {
            const prevVal = next[c];
            if (
              prevVal &&
              prevVal.week === val.week &&
              prevVal.month === val.month &&
              prevVal.month3 === val.month3 &&
              prevVal.month6 === val.month6 &&
              prevVal.year1 === val.year1
            ) {
              continue;
            }
            next[c] = val;
            changed = true;
          }
          return changed ? next : prev;
        });
        for (const key of Object.keys(batchResults)) {
          delete batchResults[key];
        }
      };

      await asyncPool(4, missing, async (code) => {
        const value = await fetchFundPeriodReturns(code);
        periodReturnsCacheRef.current.set(code, value);
        if (cancelled) return;

        batchResults[code] = value;

        if (updateTimeout) clearTimeout(updateTimeout);
        updateTimeout = setTimeout(triggerBatchUpdate, 100);
      });

      triggerBatchUpdate();
    })();

    return () => {
      cancelled = true;
    };
  }, [periodReturnsEnabled, dataCodesKey, dataCodes]);

  return {
    relatedSectorByCode,
    sectorQuoteByLabel,
    periodReturnsByCode,
    dataSourceAccuracyLabels,
    withRelatedSectorFund,
    getFundCardPropsWithRelatedSector
  };
}
