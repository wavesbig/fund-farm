import { useState, useEffect } from 'react';
import { nowInTz, formatDate } from '../lib/fundHelpers';
import { fetchShanghaiIndexDate } from '../api/fund';
import { isTradingDay as isCalendarTradingDay } from '../lib/tradingCalendar';

export interface UseTradingDayReturn {
  isTradingDay: boolean;
}

/**
 * 检测当前是否为 A 股交易日
 * - 周末直接判定为非交易日
 * - 结合法定节假日日历与上证指数最新交易时间综合校验
 * - 每 30 分钟自动重新检查一次
 */
export function useTradingDay(): UseTradingDayReturn {
  const [isTradingDay, setIsTradingDay] = useState<boolean>(true); // 默认为交易日，通过接口校正

  const checkTradingDay = async () => {
    const todayStr = formatDate();
    const now = nowInTz();
    const isWeekend = now.day() === 0 || now.day() === 6;

    // 周末直接判定为非交易日
    if (isWeekend) {
      setIsTradingDay(false);
      return;
    }

    // 优先采用法定节假日日历快速判定
    if (!isCalendarTradingDay(now)) {
      setIsTradingDay(false);
      return;
    }

    // 工作日通过上证指数行情做二次校验
    try {
      const dateStr = await fetchShanghaiIndexDate();
      if (!dateStr) {
        setIsTradingDay(!isWeekend);
        return;
      }
      const currentStr = todayStr.replace(/-/g, '');
      if (dateStr === currentStr) {
        setIsTradingDay(true);
      } else {
        const minutes = now.hour() * 60 + now.minute();
        // 开盘 30 分钟后若上证指数交易日期仍未更新，则判定休市
        if (minutes >= 9 * 60 + 30) {
          setIsTradingDay(false);
        } else {
          setIsTradingDay(isCalendarTradingDay(now));
        }
      }
    } catch {
      setIsTradingDay(isCalendarTradingDay(now));
    }
  };

  useEffect(() => {
    checkTradingDay();
    // 每30分钟检查一次
    const timer = setInterval(checkTradingDay, 60000 * 30);
    return () => clearInterval(timer);
  }, []);

  return { isTradingDay };
}
