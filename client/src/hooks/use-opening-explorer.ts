import { useQuery, keepPreviousData } from "@tanstack/react-query";

interface ExplorerMove {
  uci: string;
  san: string;
  averageRating: number;
  white: number; // Wins
  draws: number;
  black: number; // Wins
  game: any;
}

interface ExplorerResponse {
  white: number;
  draws: number;
  black: number;
  moves: ExplorerMove[];
  topGames: any[];
}

export function useOpeningExplorer(fen: string) {
  // Only query for the first few moves or standard positions to avoid spamming
  // Lichess API is used here as a read-only data source for stats
  return useQuery({
    queryKey: ['opening-explorer', fen],
    queryFn: async () => {
      // Normalize FEN for URL (replace spaces)
      const encodedFen = encodeURIComponent(fen);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      try {
        const res = await fetch(`https://explorer.lichess.ovh/masters?fen=${encodedFen}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          // 根据状态码提供更详细的错误信息
          if (res.status === 429) {
            throw new Error("Rate limit exceeded - please try again later");
          } else if (res.status === 404) {
            // 404表示没有找到该位置的统计数据，这不是错误，而是正常情况
            return { white: 0, draws: 0, black: 0, moves: [], topGames: [] };
          } else {
            throw new Error(`Failed to fetch opening stats: ${res.status} ${res.statusText}`);
          }
        }
        
        const data = await res.json();
        return data as ExplorerResponse;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Opening explorer request timed out');
        }
        throw error;
      }
    },
    enabled: !!fen,
    staleTime: Infinity, // Opening stats don't change often
    placeholderData: keepPreviousData,
  });
}
