import { MAX_CENTIPAWN_EVAL, EVAL_THRESHOLD_WHITE_ADVANTAGE, EVAL_THRESHOLD_BLACK_ADVANTAGE } from "@/constants/chess";

interface EvaluationBarProps {
  cp: number; // Centipawns (positive = white advantage)
  mate: number | null;
}

export function EvaluationBar({ cp, mate }: EvaluationBarProps) {
  // Normalize CP for visualization (clamp between -500 and 500 usually)
  let percent = 50;

  if (mate !== null) {
    // If mate found, bar goes full
    percent = mate > 0 ? 100 : 0;
  } else {
    // Sigmoid-like scaling for eval bar
    const clampedCp = Math.max(-MAX_CENTIPAWN_EVAL, Math.min(MAX_CENTIPAWN_EVAL, cp));
    percent = 50 + (clampedCp / MAX_CENTIPAWN_EVAL) * 50;
  }

  // Ensure bounds
  percent = Math.max(EVAL_THRESHOLD_WHITE_ADVANTAGE, Math.min(EVAL_THRESHOLD_BLACK_ADVANTAGE, percent));

  return (
    <div className="h-full w-4 lg:w-6 bg-secondary/50 rounded-md overflow-hidden flex flex-col relative border border-white/5">
      {/* Black's portion */}
      <div 
        className="w-full bg-zinc-800 transition-all duration-500 ease-in-out"
        style={{ height: `${100 - percent}%` }}
      />
      
      {/* White's portion */}
      <div 
        className="w-full bg-zinc-100 transition-all duration-500 ease-in-out"
        style={{ height: `${percent}%` }}
      />

      {/* Numerical Label */}
      <div className={`absolute w-full text-[10px] font-bold text-center z-10 
        ${percent > 50 ? 'bottom-1 text-zinc-800' : 'top-1 text-zinc-200'}`}
      >
        {mate !== null ? `M${Math.abs(mate)}` : (Math.abs(cp) / 100).toFixed(1)}
      </div>
    </div>
  );
}
