import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Header } from "@/components/Header";
import { EvaluationBar } from "@/components/EvaluationBar";
import { OpeningTree } from "@/components/OpeningTree";
import { SystemValidator } from "@/components/SystemValidator";
import { useStockfish } from "@/hooks/use-stockfish";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Cpu, Users, Sword } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  // Game State
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  
  // Modules
  const { settings, updateSettings } = useSettings();
  const { isReady, evaluation, analyze, getBestMove, stop } = useStockfish();
  
  // AI vs AI State
  const [aiVsAiActive, setAiVsAiActive] = useState(false);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Validations
  const [validated, setValidated] = useState(false);

  // Analysis Effect
  useEffect(() => {
    analyze(fen);
  }, [fen, analyze]);

  // Handle Game Over
  useEffect(() => {
    if (game.isGameOver()) {
      setAiVsAiActive(false);
      // Could show result modal here
    }
  }, [game]);

  // AI Logic
  useEffect(() => {
    // 1. AI vs AI Mode
    if (settings.toggleAIVSAI && aiVsAiActive && !game.isGameOver()) {
      const makeAiMove = async () => {
        // Small delay for visuals
        await new Promise(r => setTimeout(r, 500));
        const bestMove = await getBestMove(game.fen(), 2); // Master level for demo
        safeMove(bestMove);
      };
      makeAiMove();
    } 
    // 2. Player vs AI Mode (If it's AI's turn)
    else if (settings.toggleVsAI && !settings.toggleAIVSAI && !game.isGameOver()) {
      const isPlayerTurn = game.turn() === 'w'; // Assuming Player is White
      if (!isPlayerTurn) {
        const makeAiMove = async () => {
          const bestMove = await getBestMove(game.fen(), settings.aiDifficulty);
          safeMove(bestMove);
        };
        makeAiMove();
      }
    }
  }, [fen, settings, aiVsAiActive]);

  function safeMove(move: string | { from: string; to: string; promotion?: string }) {
    try {
      setGame(prev => {
        const next = new Chess(prev.fen());
        const result = next.move(move);
        if (result) {
          setFen(next.fen());
          setMoveHistory(h => [...h, result.san]);
          return next;
        }
        return prev;
      });
    } catch (e) {
      console.warn("Invalid move attempted", move);
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    // Block moves if AI vs AI is running
    if (aiVsAiActive) return false;

    // Block if it's AI's turn in PvAI mode
    if (settings.toggleVsAI && !settings.toggleAIVSAI && game.turn() === 'b') return false;

    try {
      const move = {
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // always promote to queen for simplicity
      };

      const tempGame = new Chess(game.fen());
      const result = tempGame.move(move);

      if (result) {
        setGame(tempGame);
        setFen(tempGame.fen());
        setMoveHistory(h => [...h, result.san]);
        return true;
      }
    } catch (error) {
      return false;
    }
    return false;
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setMoveHistory([]);
    setAiVsAiActive(false);
    stop();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body">
      {!validated && <SystemValidator isStockfishReady={isReady} onValidationComplete={() => setValidated(true)} />}
      
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-64px)] overflow-y-auto lg:overflow-hidden">
        
        {/* LEFT: Game Board Area */}
        <div className="w-full lg:flex-1 flex flex-col items-center justify-center p-4 lg:p-8 bg-gradient-to-b from-background to-secondary/20 relative min-h-[500px] lg:min-h-0">
          
          {/* Status Indicators */}
          <div className="absolute top-4 left-4 lg:left-8 flex gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-white/5 text-[10px] lg:text-xs font-mono">
               <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
               STOCKFISH 10
             </div>
          </div>

          <div className="flex gap-2 lg:gap-4 items-stretch h-auto w-full max-w-[min(90vw,600px)] aspect-square lg:aspect-auto lg:h-[min(80vw,600px)]">
            {/* 评估条 (Eval Bar) */}
            <EvaluationBar cp={evaluation.cp} mate={evaluation.mate} />
            
            {/* 棋盘 (Board) */}
            <div className="aspect-square flex-1 board-wrapper rounded-lg overflow-hidden border-2 lg:border-4 border-card bg-card shadow-2xl relative">
              <Chessboard 
                position={fen} 
                onPieceDrop={onDrop}
                customDarkSquareStyle={{ backgroundColor: "#779556" }}
                customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
                animationDuration={200}
                boardOrientation={settings.boardOrientation || 'white'}
              />
            </div>
          </div>

          {/* Game Controls Panel */}
          <div className="mt-8 flex items-center gap-4 bg-card/50 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  const newGame = new Chess(game.fen());
                  newGame.undo();
                  setGame(newGame);
                  setFen(newGame.fen());
                  setMoveHistory(h => h.slice(0, -1));
                }}
                disabled={aiVsAiActive || moveHistory.length === 0}
             >
                <RotateCcw className="w-5 h-5" />
             </Button>

             <div className="h-8 w-px bg-white/10 mx-2" />

             {settings.toggleAIVSAI ? (
                <Button 
                  onClick={() => setAiVsAiActive(!aiVsAiActive)}
                  className={aiVsAiActive ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-green-500/10 text-green-500 hover:bg-green-500/20"}
                >
                  {aiVsAiActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {aiVsAiActive ? "暂停演示" : "开始自战演示"}
                </Button>
             ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-4">
                   {settings.toggleVsAI ? <Cpu className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                   <span>{settings.toggleVsAI ? "人机对弈中" : "本地分析模式"}</span>
                </div>
             )}

             <Button variant="secondary" onClick={resetGame}>重新开始</Button>
          </div>
        </div>

        {/* RIGHT: Analysis & Stats Panel */}
        <div className="w-full lg:w-[400px] bg-card border-l border-white/5 flex flex-col h-full z-10">
          
          {/* 活跃模式标题 */}
          <div className="p-6 border-b border-white/5 bg-gradient-to-r from-card to-secondary/30">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sword className="w-5 h-5 text-primary" />
              {settings.toggleAIVSAI ? "引擎对局演示" : settings.toggleVsAI ? "人机对练" : "本地分析"}
            </h2>
            
            {settings.toggleVsAI && (
              <div className="mt-4">
                 <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">引擎难度</label>
                 <Select 
                   value={settings.aiDifficulty.toString()} 
                   onValueChange={(v) => updateSettings({ ...settings, aiDifficulty: parseInt(v) })}
                 >
                    <SelectTrigger className="w-full bg-background border-white/10">
                      <SelectValue placeholder="选择难度" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">菜鸟 (深度 5)</SelectItem>
                      <SelectItem value="1">高手 (深度 10)</SelectItem>
                      <SelectItem value="2">大师 (深度 18)</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
            )}
          </div>

          {/* 引擎信息 */}
          <div className="p-4 grid grid-cols-2 gap-4 border-b border-white/5">
             <div className="bg-background/50 p-3 rounded-lg border border-white/5">
                <span className="text-xs text-muted-foreground block mb-1">局势评估</span>
                <span className={`font-mono font-bold text-lg ${evaluation.cp > 0 ? "text-green-500" : "text-red-500"}`}>
                   {evaluation.cp > 0 ? "+" : ""}{(evaluation.cp / 100).toFixed(2)}
                </span>
             </div>
             <div className="bg-background/50 p-3 rounded-lg border border-white/5">
                <span className="text-xs text-muted-foreground block mb-1">引擎推荐</span>
                <span className="font-mono font-bold text-lg text-primary">
                   {evaluation.bestMove || "-"}
                </span>
             </div>
          </div>

          {/* Opening Explorer */}
          <div className="flex-1 overflow-hidden p-4">
            <OpeningTree fen={fen} onMoveSelect={(san) => safeMove(san)} />
          </div>

          {/* 历史记录 */}
          <div className="h-48 border-t border-white/5 p-4 bg-background/30 overflow-y-auto">
             <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">着法记录</h3>
             <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono">
                {moveHistory.map((move, i) => {
                  if (i % 2 === 0) {
                     return (
                        <div key={i} className="flex gap-4 border-b border-white/5 py-1">
                           <span className="text-muted-foreground w-6">{(i/2 + 1)}.</span>
                           <span className="text-foreground">{move}</span>
                           <span className="text-foreground">{moveHistory[i+1] || ""}</span>
                        </div>
                     );
                  }
                  return null;
                })}
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
