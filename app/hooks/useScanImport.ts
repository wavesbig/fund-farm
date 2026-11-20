import { isArray, isFunction } from 'lodash';
import { useState, useRef } from 'react';
import type { Dispatch, SetStateAction, RefObject, ChangeEvent } from 'react';
import {
  parseFundTextWithLLM,
  parseFundImageWithLLM,
  parseFundTextLocally,
  fetchFundData,
  searchFunds,
  fetchFundsBestSources
} from '../api/fund';
import { recordValuation } from '../lib/valuationTimeseries';
import { useFundFuzzyMatcher } from './useFundFuzzyMatcher';
import { useStorageStore, useModalStore } from '../stores';

export interface UseScanImportDeps {
  setCurrentTab: (tab: string) => void;
  setValuationSeries: Dispatch<SetStateAction<Record<string, any[]>>>;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  normalizeCode?: (code: string) => string;
  dedupeByCode?: (funds: any[]) => any[];
  setFundTagRecords?: (records: any[]) => void;
}

export interface UseScanImportReturn {
  scanModalOpen: boolean;
  setScanModalOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  scanConfirmModalOpen: boolean;
  setScanConfirmModalOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  scannedFunds: any[];
  setScannedFunds: (v: any[] | ((prev: any[]) => any[])) => void;
  selectedScannedCodes: Set<string>;
  setSelectedScannedCodes: (v: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  isScanning: boolean;
  isScanImporting: boolean;
  scanImportProgress: any;
  scanProgress: any;
  isOcrScan: boolean;
  setIsOcrScan: (v: boolean | ((prev: boolean) => boolean)) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleScanClick: () => void;
  handleScanPick: () => void;
  handleRetryOcr: () => Promise<void>;
  cancelScan: () => void;
  handleFilesUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  handleFilesDrop: (files: File[]) => void;
  toggleScannedCode: (code: string) => void;
  confirmScanImport: (
    targetGroupId?: string,
    expandAfterAdd?: boolean,
    autoDataSource?: boolean,
    autoImportTags?: boolean
  ) => Promise<void>;
}

/**
 * OCR 扫描导入基金的完整流程
 *
 * @param {object} deps
 * @param {Function} deps.setCurrentTab
 * @param {Function} deps.setValuationSeries
 * @param {Function} deps.showToast
 * @param {Function} [deps.normalizeCode]
 * @param {Function} [deps.dedupeByCode]
 * @param {Function} [deps.setFundTagRecords]
 */
export function useScanImport({
  setCurrentTab,
  setValuationSeries,
  showToast,
  normalizeCode = (c: string) => c,
  dedupeByCode = (arr: any[]) => arr,
  setFundTagRecords
}: UseScanImportDeps): UseScanImportReturn {
  // const setSuccessModal = (state: any) => useModalStore.setState({ successModal: state });
  const funds = useStorageStore((s) => s.funds);
  const favorites = useStorageStore((s) => s.favorites);
  const groups = useStorageStore((s) => s.groups);

  const setFunds = useStorageStore((s) => s.setFunds);
  const setHoldings = useStorageStore((s) => s.setHoldings);
  const setFavorites = useStorageStore((s) => s.setFavorites);
  const setGroups = useStorageStore((s) => s.setGroups);
  const setGroupHoldings = useStorageStore((s) => s.setGroupHoldings);
  const setCollapsedCodes = useStorageStore((s) => s.setCollapsedCodes);
  const setCollapsedTrends = useStorageStore((s) => s.setCollapsedTrends);

  const scanModalOpen = useModalStore((s) => s.scanModalOpen);
  const scanConfirmModalOpen = useModalStore((s) => s.scanConfirmModalOpen);
  const isScanning = useModalStore((s) => s.isScanning);
  const isScanImporting = useModalStore((s) => s.isScanImporting);
  const setScanModalOpen = (v: boolean | ((prev: boolean) => boolean)) =>
    useModalStore.setState({ scanModalOpen: isFunction(v) ? v(useModalStore.getState().scanModalOpen) : v });
  const setScanConfirmModalOpen = (v: boolean | ((prev: boolean) => boolean)) =>
    useModalStore.setState({
      scanConfirmModalOpen: isFunction(v) ? v(useModalStore.getState().scanConfirmModalOpen) : v
    });
  const setIsScanning = (v: boolean | ((prev: boolean) => boolean)) =>
    useModalStore.setState({ isScanning: isFunction(v) ? v(useModalStore.getState().isScanning) : v });
  const setIsScanImporting = (v: boolean | ((prev: boolean) => boolean)) =>
    useModalStore.setState({
      isScanImporting: isFunction(v) ? v(useModalStore.getState().isScanImporting) : v
    });
  const scannedFunds = useModalStore((s) => s.scannedFunds);
  const selectedScannedCodes = useModalStore((s) => s.selectedScannedCodes);
  const scanImportProgress = useModalStore((s) => s.scanImportProgress);
  const scanProgress = useModalStore((s) => s.scanProgress);
  const isOcrScan = useModalStore((s) => s.isOcrScan);

  const setScannedFunds = (v: any[] | ((prev: any[]) => any[])) =>
    useModalStore.setState({ scannedFunds: isFunction(v) ? v(useModalStore.getState().scannedFunds) : v });
  const setSelectedScannedCodes = (v: Set<string> | ((prev: Set<string>) => Set<string>)) =>
    useModalStore.setState({
      selectedScannedCodes: isFunction(v) ? v(useModalStore.getState().selectedScannedCodes) : v
    });
  const setScanImportProgress = (v: any) =>
    useModalStore.setState({
      scanImportProgress: isFunction(v) ? v(useModalStore.getState().scanImportProgress) : v
    });
  const setScanProgress = (v: any) =>
    useModalStore.setState({ scanProgress: isFunction(v) ? v(useModalStore.getState().scanProgress) : v });
  const setIsOcrScan = (v: boolean | ((prev: boolean) => boolean)) =>
    useModalStore.setState({ isOcrScan: isFunction(v) ? v(useModalStore.getState().isOcrScan) : v });
  const [lastOcrTexts, setLastOcrTexts] = useState<string[]>([]);

  const abortScanRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const ocrWorkerRef = useRef<any>(null);

  const { resolveFundCodeByFuzzy } = useFundFuzzyMatcher();

  const handleScanClick = () => {
    // 移除未登录限制，支持纯本地免费使用
    setScanModalOpen(true);
  };

  const handleScanPick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const searchFundsWithTimeout = async (val: string, ms: number): Promise<any[]> => {
    let timer: NodeJS.Timeout | null = null;
    const timeout = new Promise<any[]>((resolve) => {
      timer = setTimeout(() => resolve([]), ms);
    });
    try {
      return await Promise.race([searchFunds(val), timeout]);
    } catch {
      return [];
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const verifyAndFinalizeFunds = async (allFundsData: any[], addedFundCodes: Set<string>) => {
    // 处理没有基金代码但有名称的情况，通过名称搜索基金代码
    const fundsWithoutCode = allFundsData.filter((f) => !f.fundCode && f.fundName);
    if (fundsWithoutCode.length > 0) {
      setScanProgress({ stage: 'verify', current: 0, total: fundsWithoutCode.length });
      for (let i = 0; i < fundsWithoutCode.length; i++) {
        if (abortScanRef.current) break;
        const fundItem = fundsWithoutCode[i];
        setScanProgress((prev: any) => ({ ...prev, current: i + 1 }));
        try {
          const list = await searchFundsWithTimeout(fundItem.fundName, 8000);
          if (isArray(list) && list.length === 1) {
            const found = list[0];
            if (found && found.CODE && !addedFundCodes.has(found.CODE)) {
              addedFundCodes.add(found.CODE);
              fundItem.fundCode = found.CODE;
            }
          } else {
            try {
              const fuzzyCode = await resolveFundCodeByFuzzy(fundItem.fundName);
              if (fuzzyCode && !addedFundCodes.has(fuzzyCode)) {
                addedFundCodes.add(fuzzyCode);
                fundItem.fundCode = fuzzyCode;
              }
            } catch {}
          }
        } catch {}
      }
    }

    const validFunds = allFundsData.filter((f) => f.fundCode);
    const codes = validFunds.map((f) => f.fundCode).sort();
    setScanProgress({ stage: 'verify', current: 0, total: codes.length });

    const existingCodes = new Set(funds.map((f) => f.code));
    const results: any[] = [];
    for (let i = 0; i < codes.length; i++) {
      if (abortScanRef.current) break;
      const code = codes[i];
      const fundInfo = validFunds.find((f) => f.fundCode === code);
      setScanProgress((prev: any) => ({ ...prev, current: i + 1 }));

      let found: any = null;
      try {
        const list = await searchFundsWithTimeout(code, 8000);
        found = isArray(list) ? list.find((d: any) => d.CODE === code) : null;
      } catch {
        found = null;
      }

      const alreadyAdded = existingCodes.has(code);
      const ok = !!found && !alreadyAdded;
      results.push({
        code,
        name: found ? found.NAME || found.SHORTNAME || '' : fundInfo?.fundName || '',
        status: alreadyAdded ? 'added' : ok ? 'ok' : 'invalid',
        holdAmounts: fundInfo?.holdAmounts || '',
        holdGains: fundInfo?.holdGains || '',
        cost: fundInfo?.cost || '',
        share: fundInfo?.share || '',
        yesterdayProfit: fundInfo?.yesterdayProfit || ''
      });
    }

    if (abortScanRef.current) return;

    setScannedFunds(results);
    setSelectedScannedCodes(
      new Set(
        results
          .filter(
            (r) =>
              r.status === 'ok' ||
              (r.status === 'added' && (r.holdAmounts !== '' || r.holdGains !== '' || r.cost !== '' || r.share !== ''))
          )
          .map((r) => r.code)
      )
    );
    setIsOcrScan(true);
    setScanModalOpen(false);
    setScanConfirmModalOpen(true);
  };

  const processTextsInternal = async (texts: string[]) => {
    const allFundsData: Array<{
      fundCode: string;
      fundName: string;
      holdAmounts: string;
      holdGains: string;
      cost?: string;
      share?: string;
      yesterdayProfit?: string;
    }> = [];
    const addedFundCodes = new Set<string>();

    const customSettings = useStorageStore.getState().customSettings || {};
    const aiConfig = customSettings.aiConfig || {};
    const hasAiKey = Boolean(aiConfig.apiKey && aiConfig.apiKey.trim());

    for (let i = 0; i < texts.length; i++) {
      if (abortScanRef.current) break;

      const text = texts[i];
      if (!text) continue;

      setScanProgress((prev: any) => ({ ...prev, current: i + 1 }));

      let fundsRes: any = null;
      if (hasAiKey) {
        try {
          const fundsResString = await parseFundTextWithLLM(text);
          if (fundsResString) {
            fundsRes = JSON.parse(fundsResString);
          }
        } catch {
          fundsRes = null;
        }
      }

      // 如果未配置 AI 或 AI 未能解析出有效结果，使用纯前端本地规则启发式解析兜底
      if (!isArray(fundsRes) || fundsRes.length === 0) {
        fundsRes = parseFundTextLocally(text);
      }

      if (isArray(fundsRes) && fundsRes.length > 0) {
        fundsRes.forEach((fund: any) => {
          const code = fund.fundCode || '';
          const name = (fund.fundName || '').trim();
          const itemPayload = {
            fundCode: code,
            fundName: name,
            holdAmounts: fund.holdAmounts || '',
            holdGains: fund.holdGains || '',
            cost: fund.cost || '',
            share: fund.share || '',
            yesterdayProfit: fund.yesterdayProfit || ''
          };
          if (code && !addedFundCodes.has(code)) {
            addedFundCodes.add(code);
            allFundsData.push(itemPayload);
          } else if (!code && name) {
            allFundsData.push({
              ...itemPayload,
              fundCode: ''
            });
          }
        });
      }
    }

    if (abortScanRef.current) return;

    await verifyAndFinalizeFunds(allFundsData, addedFundCodes);
  };

  const handleRetryOcr = async () => {
    if (!lastOcrTexts || lastOcrTexts.length === 0) {
      showToast('没有可重试的识别内容', 'error');
      return;
    }
    setScanConfirmModalOpen(false);
    setScanModalOpen(true);
    setIsScanning(true);
    abortScanRef.current = false;
    setScanProgress({ stage: 'ocr', current: 0, total: lastOcrTexts.length });

    try {
      await processTextsInternal(lastOcrTexts);
    } catch (err) {
      if (!abortScanRef.current) {
        console.error('OCR Retry Error:', err);
        showToast('重新识别失败，请重试', 'error');
      }
    } finally {
      setIsScanning(false);
      setScanProgress({ stage: 'ocr', current: 0, total: 0 });
      setScanModalOpen(false);
    }
  };

  const cancelScan = () => {
    abortScanRef.current = true;
    setIsScanning(false);
    setScanProgress({ stage: 'ocr', current: 0, total: 0 });
    setScanModalOpen(false);
    if (ocrWorkerRef.current) {
      import('../lib/ocr').then(({ terminateOcrWorker }) => terminateOcrWorker());
      ocrWorkerRef.current = null;
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = async (files: File[]) => {
    if (!files?.length) return;

    setIsScanning(true);
    setScanModalOpen(true);
    abortScanRef.current = false;

    const customSettings = useStorageStore.getState().customSettings || {};
    const aiConfig = customSettings.aiConfig || {};
    const hasAiKey = Boolean(aiConfig.apiKey && aiConfig.apiKey.trim());

    // === 第一级：若配置了大模型，优先尝试 AI 多模态视觉直读 (Vision 直接读图，0 噪点、0 错别字) ===
    let visionSucceeded = false;
    const visionFundsData: any[] = [];
    const visionAddedCodes = new Set<string>();

    if (hasAiKey) {
      try {
        setScanProgress({ stage: 'vision', current: 0, total: files.length });
        for (let i = 0; i < files.length; i++) {
          if (abortScanRef.current) break;
          const file = files[i];
          setScanProgress((prev: any) => ({ ...prev, stage: 'vision', current: i + 1 }));

          const base64 = await fileToDataUrl(file);
          const resString = await parseFundImageWithLLM(base64);
          if (resString) {
            const parsed = JSON.parse(resString);
            if (isArray(parsed) && parsed.length > 0) {
              parsed.forEach((fund: any) => {
                const code = fund.fundCode || '';
                const name = (fund.fundName || '').trim();
                const itemPayload = {
                  fundCode: code,
                  fundName: name,
                  holdAmounts: fund.holdAmounts || '',
                  holdGains: fund.holdGains || '',
                  cost: fund.cost || '',
                  share: fund.share || '',
                  yesterdayProfit: fund.yesterdayProfit || ''
                };
                if (code && !visionAddedCodes.has(code)) {
                  visionAddedCodes.add(code);
                  visionFundsData.push(itemPayload);
                } else if (!code && name) {
                  visionFundsData.push({
                    ...itemPayload,
                    fundCode: ''
                  });
                }
              });
            } else {
              // 当前图片未返回有效基金，降级
              visionFundsData.length = 0;
              break;
            }
          } else {
            // 当前图片视觉直读未返回结果（可能模型不支持 Vision 或未配 key），降级
            visionFundsData.length = 0;
            break;
          }
        }

        if (!abortScanRef.current && visionFundsData.length > 0) {
          visionSucceeded = true;
          await verifyAndFinalizeFunds(visionFundsData, visionAddedCodes);
        }
      } catch {
        visionSucceeded = false;
      }
    }

    if (abortScanRef.current || visionSucceeded) {
      setIsScanning(false);
      setScanProgress({ stage: 'ocr', current: 0, total: 0 });
      setScanModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // === 第二级 & 第三级：自动静默降级为本地 Tesseract OCR -> LLM文本解析 / 本地正则兜底 ===
    setScanProgress({ stage: 'ocr', current: 0, total: files.length });

    try {
      let worker = ocrWorkerRef.current;
      if (!worker) {
        const { getOcrWorker } = await import('../lib/ocr');
        worker = await getOcrWorker('chi_sim+eng');
        ocrWorkerRef.current = worker;
      }

      const recognizeWithTimeout = async (file: File, ms: number) => {
        let timer: NodeJS.Timeout | null = null;
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('OCR_TIMEOUT')), ms);
        });
        try {
          return await Promise.race([worker.recognize(file), timeout]);
        } finally {
          if (timer) clearTimeout(timer);
        }
      };

      const extractedTexts: string[] = [];
      for (let i = 0; i < files.length; i++) {
        if (abortScanRef.current) break;

        const f = files[i];
        setScanProgress((prev: any) => ({ ...prev, stage: 'ocr', current: i + 1 }));

        let text = '';
        try {
          const res = await recognizeWithTimeout(f, 30000);
          text = res?.data?.text || '';
        } catch (e: any) {
          if (String(e?.message || '').includes('OCR_TIMEOUT')) {
            if (worker) {
              const { terminateOcrWorker } = await import('../lib/ocr');
              await terminateOcrWorker();
              ocrWorkerRef.current = null;
            }
            throw e;
          }
          text = '';
        }
        if (text) {
          extractedTexts.push(text);
        }
      }

      if (abortScanRef.current) return;

      setLastOcrTexts(extractedTexts);

      if (extractedTexts.length > 0) {
        setScanProgress({ stage: 'ocr', current: 0, total: extractedTexts.length });
        await processTextsInternal(extractedTexts);
      } else {
        setScannedFunds([]);
        setSelectedScannedCodes(new Set());
        setIsOcrScan(true);
        setScanModalOpen(false);
        setScanConfirmModalOpen(true);
      }
    } catch (err) {
      if (!abortScanRef.current) {
        console.error('OCR Error:', err);
        showToast('图片识别失败，请重试或更换更清晰的截图', 'error');
      }
    } finally {
      setIsScanning(false);
      setScanProgress({ stage: 'ocr', current: 0, total: 0 });
      setScanModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFilesUpload = (event: ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(event.target.files || []));
  };

  const handleFilesDrop = (files: File[]) => {
    processFiles(files);
  };

  const toggleScannedCode = (code: string) => {
    setSelectedScannedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const confirmScanImport = async (
    targetGroupId = 'all',
    expandAfterAdd = true,
    autoDataSource = true,
    autoImportTags = true
  ) => {
    const parseAmount = (val: unknown) => {
      if (!val && val !== 0) return null;
      const num = parseFloat(String(val).replace(/,/g, ''));
      return isNaN(num) ? null : num;
    };

    const rawCodes = Array.from(selectedScannedCodes);
    const targetExists = (code: string) => {
      if (!code) return false;
      if (targetGroupId === 'all') return funds.some((f) => f.code === code);
      if (targetGroupId === 'fav') return favorites?.has?.(code);
      const g = groups.find((x) => x.id === targetGroupId);
      return !!(g && isArray(g.codes) && g.codes.includes(code));
    };

    const codes = rawCodes.filter((c) => {
      const exists = targetExists(c);
      const scannedFund = scannedFunds.find((f) => f.code === c);
      const holdAmounts = parseAmount(scannedFund?.holdAmounts);
      const holdGains = parseAmount(scannedFund?.holdGains);
      const scannedShare = parseAmount(scannedFund?.share);
      const scannedCost = parseAmount(scannedFund?.cost);
      const hasHoldingData =
        (scannedShare !== null && (scannedCost !== null || holdAmounts !== null)) ||
        (holdAmounts !== null && holdGains !== null);
      return !exists || hasHoldingData;
    });

    if (codes.length === 0) {
      showToast('所选基金已在目标分组中', 'info');
      return;
    }
    // 保持确认弹框展示，在确认按钮上内联呈现导入进度
    setIsScanImporting(true);
    setScanImportProgress({ current: 0, total: codes.length, success: 0, failed: 0 });

    try {
      let bestSources: Record<string, any> = {};
      if (autoDataSource && codes.length > 0) {
        try {
          bestSources = (await fetchFundsBestSources(codes)) || {};
        } catch (e) {
          console.error('fetchFundsBestSources error:', e);
        }
      }

      const newFunds: any[] = [];
      const newHoldings: Record<string, { share: number; cost: number }> = {};
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < codes.length; i++) {
        const code = codes[i];
        setScanImportProgress((prev: any) => ({ ...prev, current: i + 1 }));

        const existed = funds.some((existing) => existing.code === code);
        try {
          const data = existed ? funds.find((f) => f.code === code) || null : await fetchFundData(code);
          if (!existed && data) {
            const fundToAdd = { ...data };
            if (autoDataSource && bestSources[code]) {
              fundToAdd.autoSource = true;
              fundToAdd.dataSource = bestSources[code];
            }
            newFunds.push(fundToAdd);
          }

          const scannedFund = scannedFunds.find((f) => f.code === code);
          const holdAmounts = parseAmount(scannedFund?.holdAmounts);
          const holdGains = parseAmount(scannedFund?.holdGains);
          const scannedShare = parseAmount(scannedFund?.share);
          const scannedCost = parseAmount(scannedFund?.cost);
          const numDwjz = Number(data?.dwjz);
          const numGsz = Number(data?.gsz);
          const effectiveNav =
            Number.isFinite(numDwjz) && numDwjz > 0 ? numDwjz : Number.isFinite(numGsz) && numGsz > 0 ? numGsz : 0;

          let calculatedShare: number | null = null;
          let calculatedCost: number | null = null;

          if (scannedShare !== null && scannedCost !== null) {
            // 1. 截图直接识别到份额与成本价（最精确，直接采用！）
            calculatedShare = scannedShare;
            calculatedCost = scannedCost;
          } else if (scannedShare !== null && holdAmounts !== null) {
            // 2. 识别到份额和总金额，若有收益则算成本，若无收益则以当前金额除以份额
            calculatedShare = scannedShare;
            const profit = holdGains !== null ? holdGains : 0;
            const principal = holdAmounts - profit;
            calculatedCost = calculatedShare > 0 ? principal / calculatedShare : 0;
          } else if (scannedCost !== null && holdAmounts !== null && effectiveNav > 0) {
            // 3. 识别到成本价和持有金额，通过净值折算份额
            calculatedShare = holdAmounts / effectiveNav;
            calculatedCost = scannedCost;
          } else if (holdAmounts !== null && effectiveNav > 0) {
            // 4. 旧推导方式：基于金额、收益与实时净值推算
            const share = holdAmounts / effectiveNav;
            const profit = holdGains !== null ? holdGains : 0;
            const principal = holdAmounts - profit;
            calculatedCost = share > 0 ? principal / share : 0;
            calculatedShare = share;
          }

          if (calculatedShare !== null && calculatedCost !== null && calculatedShare > 0) {
            newHoldings[code] = {
              share: Number(calculatedShare.toFixed(4)),
              cost: Number(calculatedCost.toFixed(4))
            };
          }

          successCount++;
          setScanImportProgress((prev: any) => ({ ...prev, success: prev.success + 1 }));
        } catch {
          failedCount++;
          setScanImportProgress((prev: any) => ({ ...prev, failed: prev.failed + 1 }));
        }
      }

      const allSelectedSet = new Set(codes);

      if (newFunds.length > 0) {
        setFunds((prev) => dedupeByCode([...newFunds, ...prev]));

        const nextSeries: Record<string, any> = {};
        newFunds.forEach((u) => {
          if (u?.code != null && !u.noValuation && Number.isFinite(Number(u.gsz))) {
            nextSeries[u.code] = recordValuation(u.code, { gsz: u.gsz, gztime: u.gztime });
          }
        });
        if (Object.keys(nextSeries).length > 0) setValuationSeries((prev) => ({ ...prev, ...nextSeries }));
      }

      if (Object.keys(newHoldings).length > 0) {
        if (targetGroupId !== 'all' && targetGroupId !== 'fav') {
          setGroupHoldings((prev) => {
            const bucket = prev[targetGroupId] ? { ...prev[targetGroupId] } : {};
            return { ...prev, [targetGroupId]: { ...bucket, ...newHoldings } };
          });
        } else {
          setHoldings((prev) => ({ ...prev, ...newHoldings }));
        }
      }

      if (!expandAfterAdd) {
        setCollapsedCodes((prev) => {
          const next = new Set(prev);
          codes.forEach((code) => next.add(code));
          return next;
        });
        setCollapsedTrends((prev) => {
          const next = new Set(prev);
          codes.forEach((code) => next.add(code));
          return next;
        });
      }

      if (targetGroupId === 'fav') {
        setFavorites((prev) => {
          const next = new Set(prev);
          codes
            .map(normalizeCode)
            .filter(Boolean)
            .forEach((code) => next.add(code));
          return next;
        });
        setCurrentTab('fav');
      } else if (targetGroupId && targetGroupId !== 'all') {
        setGroups((prev) =>
          prev.map((g) => {
            if (g.id === targetGroupId) {
              return { ...g, codes: Array.from(new Set([...(g.codes || []), ...codes])) };
            }
            return g;
          })
        );
        setCurrentTab(targetGroupId);
      } else {
        setCurrentTab('all');
      }

      if (successCount > 0) {
        showToast(`成功导入 ${successCount} 支基金`, 'success');
      } else if (allSelectedSet.size > 0 && failedCount === 0) {
        showToast('所选基金已在目标分组中', 'info');
      } else {
        showToast('未能导入任何基金', 'info');
      }
    } catch {
      showToast('导入失败，请稍后重试', 'error');
    } finally {
      setIsScanImporting(false);
      setScanImportProgress({ current: 0, total: 0, success: 0, failed: 0 });
      setScannedFunds([]);
      setSelectedScannedCodes(new Set());
      setScanConfirmModalOpen(false);
    }
  };

  return {
    // 状态
    scanModalOpen,
    setScanModalOpen,
    scanConfirmModalOpen,
    setScanConfirmModalOpen,
    scannedFunds,
    setScannedFunds,
    selectedScannedCodes,
    setSelectedScannedCodes,
    isScanning,
    isScanImporting,
    scanImportProgress,
    scanProgress,
    isOcrScan,
    setIsOcrScan,
    fileInputRef,
    // 操作
    handleScanClick,
    handleScanPick,
    handleRetryOcr,
    cancelScan,
    handleFilesUpload,
    handleFilesDrop,
    toggleScannedCode,
    confirmScanImport
  };
}
