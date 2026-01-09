import { useEffect, useRef, useState, useCallback } from 'react';
import { safeAsync, ChessAppError, ERROR_CODES } from '@/utils/errorHandler';

type Evaluation = {
  cp: number; // centipawns
  mate: number | null; // moves to mate
  depth: number;
  bestMove: string;
};

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation>({ cp: 0, mate: null, depth: 0, bestMove: '' });
  const [error, setError] = useState<ChessAppError | null>(null);

  useEffect(() => {
    try {
      // Initialize Stockfish from local path
      const worker = new Worker('/stockfish.js');
      workerRef.current = worker;

      worker.onmessage = (event) => {
        const message = typeof event.data === 'string' ? event.data : '';
        if (!message) return;
        
        console.log('Stockfish:', message);

        if (message === 'readyok') {
          setIsReady(true);
          setError(null); // Clear any previous errors
        }

        if (message.startsWith('info') && message.includes('score')) {
          const cpMatch = message.match(/score cp (-?\d+)/);
          const mateMatch = message.match(/score mate (-?\d+)/);
          const depthMatch = message.match(/depth (\d+)/);
          const pvMatch = message.match(/ pv ([a-h1-8]{4})/);

          setEvaluation((prev: Evaluation) => ({
            ...prev,
            cp: cpMatch ? parseInt(cpMatch[1]) : prev.cp,
            mate: mateMatch ? parseInt(mateMatch[1]) : null,
            depth: depthMatch ? parseInt(depthMatch[1]) : prev.depth,
            bestMove: pvMatch ? pvMatch[1] : prev.bestMove,
          }));
        }
        
        if (message.startsWith('bestmove')) {
          const bestMove = message.split(' ')[1];
          setEvaluation((prev: Evaluation) => ({ ...prev, bestMove }));
        }
      };

      worker.onerror = (error) => {
        console.error('Stockfish worker error:', error);
        setError(new ChessAppError('Stockfish worker error', ERROR_CODES.STOCKFISH_ERROR, error));
      };

      worker.postMessage('uci');

      return () => {
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
      };
    } catch (err) {
      setError(new ChessAppError(
        err instanceof Error ? err.message : 'Failed to initialize Stockfish',
        ERROR_CODES.STOCKFISH_ERROR,
        err
      ));
    }
  }, []);

  const analyze = useCallback((fen: string, depth: number = 15) => {
    if (!workerRef.current || !isReady) return;
    
    try {
      workerRef.current.postMessage('stop');
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage(`go depth ${depth}`);
    } catch (err) {
      setError(new ChessAppError(
        err instanceof Error ? err.message : 'Failed to analyze position',
        ERROR_CODES.STOCKFISH_ERROR,
        err
      ));
    }
  }, [isReady]);

  const getBestMove = useCallback(async (fen: string, difficulty: number = 1): Promise<string> => {
    const result = await safeAsync(
      new Promise<string>((resolve) => {
        if (!workerRef.current) return resolve('');

        // Map 6 levels to Stockfish parameters
        // Level 0: ~800 ELO (Depth 2, 100ms) - Novice
        // Level 1: ~1200 ELO (Depth 4, 200ms) - Beginner
        // Level 2: ~1600 ELO (Depth 8, 500ms) - Amateur
        // Level 3: ~2000 ELO (Depth 12, 1000ms) - Professional
        // Level 4: ~2400 ELO (Depth 18, 2000ms) - Master
        // Level 5: ~2800 ELO (Depth 24, 4000ms) - Grandmaster
        
        const depths = [2, 4, 8, 12, 18, 24];
        const times = [100, 200, 500, 1000, 2000, 4000];
        
        const depth = depths[difficulty] ?? 10;
        const moveTime = times[difficulty] ?? 1000;

        const handler = (event: MessageEvent) => {
          if (typeof event.data === 'string' && event.data.startsWith('bestmove')) {
            workerRef.current?.removeEventListener('message', handler);
            resolve(event.data.split(' ')[1]);
          }
        };

        workerRef.current!.addEventListener('message', handler);
        
        workerRef.current!.postMessage('stop');
        workerRef.current!.postMessage(`position fen ${fen}`);
        workerRef.current!.postMessage(`go movetime ${moveTime} depth ${depth}`);
      }),
      '',
      'Getting best move from Stockfish'
    );

    if (!result.success) {
      setError(result.error!);
      return '';
    }

    return result.data ?? '';
  }, []);

  const stop = useCallback(() => {
    try {
      workerRef.current?.postMessage('stop');
    } catch (err) {
      setError(new ChessAppError(
        err instanceof Error ? err.message : 'Failed to stop analysis',
        ERROR_CODES.STOCKFISH_ERROR,
        err
      ));
    }
  }, []);

  return { isReady, evaluation, analyze, getBestMove, stop, worker: workerRef.current, error };
}
