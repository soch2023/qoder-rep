// Difficulty levels for AI
export const DIFFICULTY_LEVELS = [
  { value: "0", label: "新手 (ELO ~800)", depth: 2, time: 100 },
  { value: "1", label: "入门 (ELO ~1200)", depth: 5, time: 200 },
  { value: "2", label: "业余 (ELO ~1600)", depth: 8, time: 500 },
  { value: "3", label: "专业 (ELO ~2000)", depth: 12, time: 1000 },
  { value: "4", label: "大师 (ELO ~2400)", depth: 15, time: 2000 },
  { value: "5", label: "宗师 (ELO ~2800)", depth: 20, time: 4000 },
];

// Evaluation constants
export const MAX_CENTIPAWN_EVAL = 800;
export const EVAL_THRESHOLD_WHITE_ADVANTAGE = 5;
export const EVAL_THRESHOLD_BLACK_ADVANTAGE = 95;

// Game modes
export type GameMode = 'local' | 'vsAI' | 'aiVsAi';

// AI difficulty levels
export type DifficultyLevel = 0 | 1 | 2 | 3 | 4 | 5;

// Player color
export type PlayerColor = 'w' | 'b';

// Board orientation
export type BoardOrientation = 'white' | 'black';

// Default settings
export const DEFAULT_SETTINGS = {
  gameMode: 'local' as GameMode,
  aiDifficulty: 1 as DifficultyLevel,
  boardOrientation: 'white' as BoardOrientation,
  whiteAIDifficulty: 1 as DifficultyLevel,
  blackAIDifficulty: 2 as DifficultyLevel,
  playerColor: 'w' as PlayerColor,
};

// Timing constants
export const AI_MOVE_DELAY = 600; // ms
export const AI_VS_AI_DELAY = 500; // ms
export const DEBOUNCE_DELAY = 300; // ms

// Move history constants
export const MAX_MOVE_HISTORY_LENGTH = 1000; // Prevent infinite growth

// FEN validation regex
export const FEN_REGEX = /^[rnbqkbnrRNBQKBNR1-8\s\/]+$/;