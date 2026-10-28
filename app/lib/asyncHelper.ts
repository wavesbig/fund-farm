export async function asyncPool<T, R>(
  concurrency: number,
  iterable: Iterable<T>,
  iteratorFn: (item: T) => Promise<R> | R
): Promise<R[]> {
  const ret: Promise<R>[] = [];
  const executing = new Set<Promise<R>>();
  for (const item of iterable) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean).catch(clean);
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

/**
 * 通用异步重试工具
 * @param fn - 返回 Promise 的异步函数
 * @param retries - 重试次数
 * @param delay - 初始延迟（毫秒）
 * @returns {Promise<T>}
 */
export async function withRetry<T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // 只有在还有重试机会时才等待
      if (i < retries) {
        const backoff = delay * 2 ** i;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  }
  throw lastError;
}
