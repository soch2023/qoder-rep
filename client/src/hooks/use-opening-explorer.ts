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
      const res = await fetch(`https://explorer.lichess.ovh/masters?fen=${encodedFen}`);
      if (!res.ok) {
        throw new Error("Failed to fetch opening stats");
      }
      const data = await res.json();
      return data as ExplorerResponse;
    },
    enabled: !!fen,
    staleTime: Infinity, // Opening stats don't change often
    placeholderData: keepPreviousData,
  });
}
