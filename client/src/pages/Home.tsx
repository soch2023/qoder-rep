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
import { Play, Pause, RotateCcw, Cpu, Users, Sword, RotateCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DIFFICULTY_LEVELS = [
  { value: "0", label: "新手 (ELO ~800)", depth: 2 },
  { value: "1", label: "入门 (ELO ~1200)", depth: 5 },
  { value: "2", label: "业余 (ELO ~1600)", depth: 8 },
  { value: "3", label: "专业 (ELO ~2000)", depth: 12 },
  { value: "4", label: "大师 (ELO ~2400)", depth: 15 },
  { value: "5", label: "宗师 (ELO ~2800)", depth: 20 },
];

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
  const isPlayerTurn = settings.gameMode === 'vsAI' 
    ? game.turn() === settings.playerColor
    : true;

  useEffect(() => {
    // 1. AI vs AI Mode
    if (settings.gameMode === 'aiVsAi' && aiVsAiActive && !game.isGameOver()) {
      const makeAiMove = async () => {
        // Small delay for visuals
        await new Promise(r => setTimeout(r, 500));
        if (!aiVsAiActive) return; // Check if still active after delay
        
        const currentTurn = game.turn();
        const difficulty = currentTurn === 'w' 
          ? (settings.whiteAIDifficulty ?? 1) 
          : (settings.blackAIDifficulty ?? 2);
        
        const bestMove = await getBestMove(game.fen(), difficulty);
        if (bestMove) safeMove(bestMove);
      };
      makeAiMove();
    } 
    // 2. Player vs AI Mode (If it's AI's turn)
    else if (settings.gameMode === 'vsAI' && !game.isGameOver()) {
      if (!isPlayerTurn) {
        const makeAiMove = async () => {
          const bestMove = await getBestMove(game.fen(), settings.aiDifficulty);
          if (bestMove) safeMove(bestMove);
        };
        makeAiMove();
      }
    }
  }, [fen, settings.gameMode, settings.aiDifficulty, settings.whiteAIDifficulty, settings.blackAIDifficulty, settings.playerColor, aiVsAiActive, isPlayerTurn]);

  function safeMove(move: string | { from: string; to: string; promotion?: string }) {
    try {
      setGame(prev => {
        const next = new Chess(prev.fen());
        // For string moves (UCI from Stockfish), we need to validate and potentially handle promotion
        let moveResult;
        if (typeof move === 'string' && move.length >= 4) {
          const from = move.slice(0, 2);
          const to = move.slice(2, 4);
          const promotion = move.length === 5 ? move[4] : undefined;
          
          // Verify if it's a legal move
          const legalMoves = next.moves({ verbose: true });
          const isLegal = legalMoves.some(m => m.from === from && m.to === to);
          
          if (isLegal) {
            moveResult = next.move({ from, to, promotion: promotion || 'q' });
          }
        } else {
          moveResult = next.move(move);
        }

        if (moveResult) {
          setFen(next.fen());
          setMoveHistory(h => [...h, moveResult.san]);
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
    if (settings.gameMode === 'vsAI' && game.turn() !== settings.playerColor) return false;

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
    stop();
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setMoveHistory([]);
    setAiVsAiActive(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body">
      {!validated && <SystemValidator isStockfishReady={isReady} onValidationComplete={() => setValidated(true)} />}
      
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-64px)] overflow-y-auto lg:overflow-hidden">
        
        {/* LEFT: Game Board Area */}
          <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-gradient-to-b from-background to-secondary/20 relative min-h-[500px] lg:min-h-0">
            {/* 翻转棋盘按钮 (通用) */}
            <div className="absolute top-4 right-4 lg:right-8 z-20">
              <Button
                variant="outline"
                size="icon"
                onClick={() => updateSettings({
                  ...settings,
                  boardOrientation: settings.boardOrientation === 'white' ? 'black' : 'white'
                })}
                title="翻转棋盘"
                className="rounded-full bg-card/80 backdrop-blur-sm"
              >
                <RotateCw className="w-5 h-5" />
              </Button>
            </div>

            {/* Status Indicators */}
            <div className="absolute top-4 left-4 lg:left-8 flex gap-4 z-20">
               <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-white/5 text-[10px] lg:text-xs font-mono">
                 <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                 STOCKFISH 10
               </div>
            </div>

          <div className="flex gap-2 lg:gap-4 items-stretch h-auto w-full max-w-[600px] aspect-square touch-none overscroll-none py-1">
            {/* 评估条 (Eval Bar) */}
            <div className="h-full py-[1%]">
              <EvaluationBar cp={evaluation.cp} mate={evaluation.mate} />
            </div>
            
      {/* 棋盘 (Board) */}
      <div className="aspect-square flex-1 board-wrapper rounded-lg overflow-hidden border-2 lg:border-4 border-card bg-card shadow-2xl relative select-none p-1">
        <Chessboard 
          position={fen} 
          onPieceDrop={onDrop}
          customDarkSquareStyle={{ backgroundColor: "#779556" }}
          customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
          animationDuration={0}
          boardOrientation={settings.boardOrientation || 'white'}
          areArrowsAllowed={false}
        />
      </div>
          </div>

          {/* Game Controls Panel */}
          <div className="mt-8 flex items-center gap-4 bg-card/50 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
             <Button 
                variant="ghost" 
                className="flex gap-2"
                onClick={() => {
                  const newGame = new Chess();
                  // Reconstruct from current history to ensure undo works correctly
                  const moves = game.history();
                  moves.pop();
                  
                  // Replay all moves to get the penultimate state
                  for (const move of moves) {
                    newGame.move(move);
                  }
                  
                  // If we're in vsAI mode and it's the AI's turn after undoing,
                  // we should undo once more to get back to the player's last move
                  if (settings.gameMode === 'vsAI' && newGame.turn() !== settings.playerColor && moves.length > 0) {
                    moves.pop();
                    const playerGame = new Chess();
                    for (const move of moves) {
                      playerGame.move(move);
                    }
                    const finalFen = playerGame.fen();
                    setGame(playerGame);
                    setFen(finalFen);
                    setMoveHistory(h => h.slice(0, -2));
                  } else {
                    const finalFen = newGame.fen();
                    setGame(newGame);
                    setFen(finalFen);
                    setMoveHistory(h => h.slice(0, -1));
                  }
                  // Force Stockfish to stop any current analysis of the undone state
                  stop();
                }}
                disabled={aiVsAiActive || moveHistory.length === 0}
             >
                <RotateCcw className="w-5 h-5" />
                <span className="hidden sm:inline">悔棋回退</span>
             </Button>

             <div className="h-8 w-px bg-white/10 mx-2" />

             {settings.gameMode === 'aiVsAi' ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-4 mb-2">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">白方 (AI)</span>
                      <Select 
                        value={(settings.whiteAIDifficulty ?? 1).toString()} 
                        onValueChange={(v) => updateSettings({ ...settings, whiteAIDifficulty: parseInt(v) })}
                      >
                         <SelectTrigger className="h-7 w-24 bg-background text-[10px]">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           {DIFFICULTY_LEVELS.map(level => (
                             <SelectItem key={level.value} value={level.value}>{level.label.split(' ')[0]}</SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">黑方 (AI)</span>
                      <Select 
                        value={(settings.blackAIDifficulty ?? 2).toString()} 
                        onValueChange={(v) => updateSettings({ ...settings, blackAIDifficulty: parseInt(v) })}
                      >
                         <SelectTrigger className="h-7 w-24 bg-background text-[10px]">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           {DIFFICULTY_LEVELS.map(level => (
                             <SelectItem key={level.value} value={level.value}>{level.label.split(' ')[0]}</SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setAiVsAiActive(!aiVsAiActive)}
                    className={aiVsAiActive ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-green-500/10 text-green-500 hover:bg-green-500/20"}
                  >
                    {aiVsAiActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {aiVsAiActive ? "暂停演示" : "开始自战演示"}
                  </Button>
                </div>
             ) : (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground px-4">
                     {settings.gameMode === 'vsAI' ? <Cpu className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                     <span>{settings.gameMode === 'vsAI' ? "人机对弈中" : "本地对战模式"}</span>
                  </div>
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
              {settings.gameMode === 'aiVsAi' ? "引擎对局演示" : settings.gameMode === 'vsAI' ? "人机对练" : "本地双人对战"}
            </h2>
            
            {settings.gameMode === 'vsAI' && (
              <div className="mt-4 space-y-4">
                 <div>
                   <div className="flex items-center justify-between mb-2">
                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">玩家执色</label>
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="h-7 text-[10px] px-2"
                       onClick={() => {
                         const currentType = settings.playerColor;
                         updateSettings({ 
                           ...settings, 
                           playerColor: currentType === 'w' ? 'b' : 'w' 
                         });
                       }}
                     >
                       交换角色
                     </Button>
                   </div>
                   <div className="flex gap-2 p-1 bg-background/50 rounded-lg border border-white/10">
                     <Button 
                       variant={settings.playerColor === 'w' ? 'default' : 'ghost'} 
                       className="flex-1 h-8 text-xs"
                       onClick={() => updateSettings({ ...settings, playerColor: 'w' })}
                     >
                       执白
                     </Button>
                     <Button 
                       variant={settings.playerColor === 'b' ? 'default' : 'ghost'} 
                       className="flex-1 h-8 text-xs"
                       onClick={() => updateSettings({ ...settings, playerColor: 'b' })}
                     >
                       执黑
                     </Button>
                   </div>
                 </div>
                 <div>
                   <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">引擎难度</label>
                   <Select 
                     value={settings.aiDifficulty.toString()} 
                     onValueChange={(v) => updateSettings({ ...settings, aiDifficulty: parseInt(v) })}
                   >
                      <SelectTrigger className="w-full bg-background border-white/10">
                        <SelectValue placeholder="选择难度" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map(level => (
                          <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                 </div>
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
