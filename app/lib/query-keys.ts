export const eastmoneyScript = (normalizedUrl: string) => ['eastmoneyScript', normalizedUrl] as const;

export const fundHoldingsArchives = (fundCode: string | number) =>
  ['fundHoldingsArchives', String(fundCode).trim()] as const;

export const relatedSectors = (code: string | number, authSegment: string | number) =>
  ['relatedSectors', String(code).trim(), String(authSegment)] as const;

export const fundSecid = (relatedSector: string) => ['fundSecid', String(relatedSector).trim()] as const;

export const eastSectorQuote = (secid: string) => ['eastSectorQuote', String(secid).trim()] as const;

export const pingzhongdata = (fundCode: string | number) => ['pingzhongdata', String(fundCode).trim()] as const;

export const fundHistory = (code: string | number, range: string, netValueType: string = 'unit') =>
  ['fundHistory', String(code).trim(), range, netValueType] as const;

export const fundValuationTrend = (code: string | number, range: string) =>
  ['fundValuationTrend', String(code).trim(), range] as const;

export const marketStatus = () => ['marketStatus'] as const;

export const fundSearch = (val: string | number) => ['fundSearch', String(val).trim()] as const;

export const eastmoneyFundcodeSearchList = () => ['eastmoneyFundcodeSearchList'] as const;

export const ocrFundChart = (fundCode: string | number, dateStr: string) =>
  ['ocrFundChart', String(fundCode).trim(), dateStr] as const;

export const ocrDailyRemaining = (userId: string | null | undefined) =>
  ['ocrDailyRemaining', String(userId || '').trim()] as const;

export const fundConfirmDays = (fundCode: string | number) => ['fundConfirmDays', String(fundCode).trim()] as const;

export const bestValuationSource = (
  code: string | number,
  jzrq: string | null | undefined,
  actualZzl: number | null | undefined
) => ['bestValuationSource', String(code).trim(), jzrq, actualZzl] as const;

export const fundBestSource = (fundCode: string | number) => ['fundBestSource', String(fundCode).trim()] as const;

export const isQdiiFund = (fundCode: string | number) => ['isQdiiFund', String(fundCode).trim()] as const;

/** 天天基金 FundValuationLast 批量估值接口缓存键 */
export const fundValuationLast = (fundCode: string | number) => ['fundValuationLast', String(fundCode).trim()] as const;
