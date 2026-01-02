import { useOpeningExplorer } from "@/hooks/use-opening-explorer";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function OpeningTree({ fen, onMoveSelect }: { fen: string, onMoveSelect: (move: string) => void }) {
  const { data, isLoading, error } = useOpeningExplorer(fen);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading Explorer...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No master games found for this position.
      </div>
    );
  }

  const totalGames = data.white + data.draws + data.black;

  return (
    <div className="flex flex-col h-full bg-card/30 rounded-xl overflow-hidden">
      <div className="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">Opening Explorer</h3>
        <span className="text-xs text-muted-foreground">{totalGames.toLocaleString()} Master Games</span>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {data.moves.slice(0, 10).map((move) => {
            const moveTotal = move.white + move.draws + move.black;
            const winRate = ((move.white + move.draws / 2) / moveTotal * 100).toFixed(1);
            
            // Frequency highlight
            const isHighFreq = moveTotal / totalGames > 0.3;
            const isLowFreq = moveTotal / totalGames < 0.05;

            return (
              <button
                key={move.san}
                onClick={() => onMoveSelect(move.san)}
                className="flex items-center justify-between p-3 border-b border-white/5 hover:bg-white/5 transition-colors group text-sm"
              >
                <div className="flex items-center gap-3 w-24">
                  <span className="font-bold font-mono text-primary">{move.san}</span>
                  {isHighFreq && <TrendingUp className="w-3 h-3 text-green-500 opacity-50" />}
                  {isLowFreq && <TrendingDown className="w-3 h-3 text-red-500 opacity-50" />}
                </div>

                <div className="flex-1 flex items-center gap-2">
                   {/* Mini Bar Chart */}
                   <div className="flex h-2 w-full rounded-full overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                      <div className="bg-zinc-200" style={{ width: `${(move.white / moveTotal) * 100}%` }} />
                      <div className="bg-zinc-500" style={{ width: `${(move.draws / moveTotal) * 100}%` }} />
                      <div className="bg-zinc-800" style={{ width: `${(move.black / moveTotal) * 100}%` }} />
                   </div>
                </div>

                <div className="w-12 text-right font-mono text-xs text-muted-foreground group-hover:text-foreground">
                  {winRate}%
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
