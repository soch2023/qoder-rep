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
  const [isAIThinking, setIsAIThinking] = useState(false);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Validations
  const [validated, setValidated] = useState(false);

  // Analysis Effect with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fen) {
        analyze(fen);
      }
    }, 300); // 300ms防抖
    
    return () => clearTimeout(timer);
  }, [fen, analyze]);

  // Handle Game Over
  useEffect(() => {
    if (game.isGameOver()) {
      setAiVsAiActive(false);
      
      // 显示游戏结果
      let resultText = "游戏结束";
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? '黑方' : '白方';
        resultText = `将杀！${winner}获胜！`;
      } else if (game.isDraw()) {
        resultText = "平局";
        if (game.isStalemate()) {
          resultText = "逼和";
        } else if (game.isThreefoldRepetition()) {
          resultText = "三次重复局面";
        } else if (game.isInsufficientMaterial()) {
          resultText = "双方子力均不足以将杀";
        }
      } else if (game.isCheck()) {
        resultText = "将军";
      }
      
      // 可以在这里显示结果对话框或通知
      console.log(resultText); // 临时输出结果
    }
  }, [game]);

  // AI Logic
  const isPlayerTurn = settings.gameMode === 'vsAI' 
    ? game.turn() === settings.playerColor
    : false;

  useEffect(() => {
    // 1. AI vs AI Mode
    if (settings.gameMode === 'aiVsAi' && aiVsAiActive && !game.isGameOver()) {
      const makeAiMove = async () => {
        setIsAIThinking(true);
        await new Promise(r => setTimeout(r, 500));
        // 确保模式和活动状态未改变
        if (!aiVsAiActive || settings.gameMode !== 'aiVsAi' || game.isGameOver()) {
          setIsAIThinking(false);
          return; 
        }
        
        const currentTurn = game.turn();
        const difficulty = currentTurn === 'w' 
          ? (settings.whiteAIDifficulty ?? 1) 
          : (settings.blackAIDifficulty ?? 2);
        
        const bestMove = await getBestMove(game.fen(), difficulty);
        if (bestMove && settings.gameMode === 'aiVsAi' && aiVsAiActive) {
          safeMove(bestMove);
        }
        setIsAIThinking(false);
      };
      makeAiMove();
    } 
    // 2. Player vs AI Mode
    else if (settings.gameMode === 'vsAI' && !game.isGameOver() && !isPlayerTurn) {
      const makeAiMove = async () => {
        setIsAIThinking(true);
        await new Promise(r => setTimeout(r, 600)); // 稍长一点的延迟，给悔棋留足制动时间
        
        // 关键防护：确保现在依然是AI回合，且模式没变
        if (settings.gameMode !== 'vsAI' || game.turn() === settings.playerColor || game.isGameOver()) {
          setIsAIThinking(false);
          return;
        }
        
        const bestMove = await getBestMove(game.fen(), settings.aiDifficulty);
        
        // 再次检查局面，防止计算期间发生了悔棋
        if (bestMove && settings.gameMode === 'vsAI' && game.turn() !== settings.playerColor) {
          safeMove(bestMove);
        }
        setIsAIThinking(false);
      };
      makeAiMove();
    }
  }, [fen, settings.gameMode, settings.aiDifficulty, settings.whiteAIDifficulty, settings.blackAIDifficulty, settings.playerColor, aiVsAiActive, isPlayerTurn]);

  function safeMove(move: string | { from: string; to: string; promotion?: string }) {
    try {
      setGame(prev => {
        // 防止对局已结束或状态异常时继续走棋
        if (prev.isGameOver()) return prev;

        const next = new Chess(prev.fen());
        let moveResult;
        
        try {
          if (typeof move === 'string' && move.length >= 4) {
            const from = move.slice(0, 2);
            const to = move.slice(2, 4);
            const promotion = move.length === 5 ? move[4] : 'q';
            moveResult = next.move({ from, to, promotion });
          } else {
            moveResult = next.move(move);
          }
        } catch (err) {
          console.warn("Chess.js move validation error:", err);
          return prev;
        }

        if (moveResult) {
          const newFen = next.fen();
          // 验证新FEN是否有效
          try {
            new Chess(newFen); // 尝试创建新游戏实例以验证FEN
          } catch (validationErr) {
            console.error("Invalid FEN generated:", newFen, validationErr);
            return prev; // 如果生成的FEN无效，则返回之前的状态
          }
          // 使用 setTimeout 确保 FEN 更新在下一帧触发，避免渲染竞争
          setTimeout(() => setFen(newFen), 0);
          setMoveHistory(h => [...h, moveResult.san]);
          
          // 重置AI思考状态，确保AI在正确的时机行动
          if (settings.gameMode === 'vsAI') {
            setIsAIThinking(false);
          }
          
          return next;
        }
        return prev;
      });
    } catch (e) {
      console.warn("safeMove outer error:", e);
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (aiVsAiActive) return false;
    if (settings.gameMode === 'vsAI' && game.turn() !== settings.playerColor) return false;

    try {
      const move = { from: sourceSquare, to: targetSquare, promotion: "q" };
      const next = new Chess(game.fen());
      const result = next.move(move);

      if (result) {
        setGame(next);
        setFen(next.fen());
        setMoveHistory(h => [...h, result.san]);
        
        // 重置AI思考状态，确保AI在正确的时机行动
        if (settings.gameMode === 'vsAI') {
          setIsAIThinking(false);
        }
        
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
                  stop(); // 停止AI计算
                  
                  if (moveHistory.length === 0) return;
                  
                  const history = [...moveHistory];
                  history.pop(); // 移除最后一步
                  
                  try {
                    // 创建新游戏并从标准起始位开始推演
                    const newGame = new Chess();
                    let success = true;
                    
                    for (const m of history) {
                      try {
                        const result = newGame.move(m);
                        if (!result) {
                          console.error("Invalid move in history:", m);
                          success = false;
                          break;
                        }
                      } catch (err) {
                        console.error("Reconstruction error at move:", m, err);
                        success = false;
                        break;
                      }
                    }
                    
                    if (success) {
                      const newFen = newGame.fen();
                      // 先更新基础状态
                      setMoveHistory(history);
                      setFen(newFen);
                      setGame(newGame);
                      
                      // 重要：在人机对战模式下，悔棋后取消AI的思考状态
                      if (settings.gameMode === 'vsAI') {
                        setIsAIThinking(false);
                      }
                    } else {
                      // 如果历史记录推演失败，作为保底方案：使用 chess.js 自带的 undo
                      // 虽然可能不如历史推演精准，但能防止崩溃
                      const rollbackGame = new Chess(game.fen());
                      if (rollbackGame.history().length > 0) {
                        rollbackGame.undo();
                        const rollbackFen = rollbackGame.fen();
                        setGame(rollbackGame);
                        setFen(rollbackFen);
                        setMoveHistory(h => h.slice(0, -1));
                        
                        // 重要：在人机对战模式下，悔棋后取消AI的思考状态
                        if (settings.gameMode === 'vsAI') {
                          setIsAIThinking(false);
                        }
                      }
                    }
                  } catch (error) {
                    console.error("Undo operation failed:", error);
                    // 最后的保底方案：重置到上一步
                    if (moveHistory.length > 0) {
                      setMoveHistory(h => h.slice(0, -1));
                    }
                  }
                }}
                disabled={aiVsAiActive || isAIThinking || moveHistory.length === 0}
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
                   {isAIThinking ? "思考中..." : evaluation.bestMove || "-"}
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
