// Unified error handling utility
export class ChessAppError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'ChessAppError';
    this.code = code;
    this.details = details;
  }
}

// Error codes
export const ERROR_CODES = {
  INVALID_FEN: 'INVALID_FEN',
  INVALID_MOVE: 'INVALID_MOVE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  STOCKFISH_ERROR: 'STOCKFISH_ERROR',
  GAME_OVER: 'GAME_OVER',
  INVALID_SESSION_ID: 'INVALID_SESSION_ID',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SETTINGS_LOAD_FAILED: 'SETTINGS_LOAD_FAILED',
  SETTINGS_SAVE_FAILED: 'SETTINGS_SAVE_FAILED',
} as const;

// Error logging function
export const logError = (error: unknown, context: string = '') => {
  if (error instanceof ChessAppError) {
    console.error(`[ChessAppError - ${error.code}] ${context}`, {
      message: error.message,
      details: error.details,
      stack: error.stack
    });
  } else if (error instanceof Error) {
    console.error(`[Error] ${context}`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  } else {
    console.error(`[Unknown Error] ${context}`, error);
  }
};

// Safe wrapper for async operations
export const safeAsync = async <T>(
  promise: Promise<T>,
  fallbackValue?: T,
  context: string = ''
): Promise<{ success: boolean; data?: T; error?: ChessAppError }> => {
  try {
    const data = await promise;
    return { success: true, data };
  } catch (error) {
    logError(error, context);
    
    if (error instanceof ChessAppError) {
      return { success: false, error };
    }
    
    const chessError = new ChessAppError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'UNKNOWN_ERROR',
      error
    );
    
    return { success: false, error: chessError };
  }
};

// Type guard for ChessAppError
export const isChessAppError = (error: unknown): error is ChessAppError => {
  return error instanceof ChessAppError;
};

// Error message formatter
export const formatErrorMessage = (error: ChessAppError): string => {
  switch (error.code) {
    case ERROR_CODES.INVALID_FEN:
      return `无效的FEN字符串: ${error.message}`;
    case ERROR_CODES.INVALID_MOVE:
      return `无效的移动: ${error.message}`;
    case ERROR_CODES.NETWORK_ERROR:
      return `网络连接失败，请检查您的网络连接`;
    case ERROR_CODES.API_ERROR:
      return `API请求失败: ${error.message}`;
    case ERROR_CODES.STOCKFISH_ERROR:
      return `引擎错误: ${error.message}`;
    case ERROR_CODES.GAME_OVER:
      return `游戏已结束: ${error.message}`;
    case ERROR_CODES.INVALID_SESSION_ID:
      return `无效的会话ID: ${error.message}`;
    case ERROR_CODES.DATABASE_ERROR:
      return `数据库错误: ${error.message}`;
    case ERROR_CODES.SETTINGS_LOAD_FAILED:
      return `加载设置失败: ${error.message}`;
    case ERROR_CODES.SETTINGS_SAVE_FAILED:
      return `保存设置失败: ${error.message}`;
    default:
      return `发生错误: ${error.message}`;
  }
};