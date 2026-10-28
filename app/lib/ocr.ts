import { createWorker, type Worker } from 'tesseract.js';

let sharedWorker: Worker | null = null;

export async function getOcrWorker(lang: string = 'chi_sim+eng'): Promise<Worker> {
  if (sharedWorker) return sharedWorker;

  const cdnBases = ['https://cdn.jsdelivr.net/npm', 'https://fastly.jsdelivr.net/npm'];
  const coreCandidates = ['tesseract-core-simd-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'];
  let lastErr: unknown = null;
  for (const base of cdnBases) {
    for (const coreFile of coreCandidates) {
      try {
        const worker = await createWorker(lang, 1, {
          workerPath: `${base}/tesseract.js@v5.1.1/dist/worker.min.js`,
          corePath: `${base}/tesseract.js-core@v5.1.1/${coreFile}`
        });
        sharedWorker = worker;
        return worker;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!lastErr) break;
  }
  if (lastErr) throw lastErr;
  return sharedWorker!;
}

export async function terminateOcrWorker(): Promise<void> {
  if (sharedWorker) {
    try {
      await sharedWorker.terminate();
    } catch {
      // 忽略终止失败
    }
    sharedWorker = null;
  }
}
