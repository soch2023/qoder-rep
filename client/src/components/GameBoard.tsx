import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { EvaluationBar } from "@/components/EvaluationBar";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

interface GameBoardProps {
  game: Chess;
  fen: string;
  onDrop: (sourceSquare: string, targetSquare: string) => boolean;
  onFenChange: (fen: string) => void;
  onMoveHistoryChange: (move: string) => void;
  isReady: boolean;
  evaluation: {
    cp: number;
    mate: number | null;
    depth: number;
    bestMove: string;
  };
  settings: {
    boardOrientation?: 'white' | 'black';
  };
  updateSettings: (settings: any) => void;
}

export function GameBoard({
  game,
  fen,
  onDrop,
  onFenChange,
  onMoveHistoryChange,
  isReady,
  evaluation,
  settings,
  updateSettings
}: GameBoardProps) {
  return (
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
    </div>
  );
}