import { DIFFICULTY_LEVELS, MAX_CENTIPAWN_EVAL, DEFAULT_SETTINGS } from './chess';

describe('Chess Constants', () => {
  test('should have correct difficulty levels', () => {
    expect(DIFFICULTY_LEVELS).toHaveLength(6);
    
    const firstLevel = DIFFICULTY_LEVELS[0];
    expect(firstLevel.value).toBe("0");
    expect(firstLevel.label).toBe("新手 (ELO ~800)");
    expect(firstLevel.depth).toBe(2);
    expect(firstLevel.time).toBe(100);
    
    const lastLevel = DIFFICULTY_LEVELS[5];
    expect(lastLevel.value).toBe("5");
    expect(lastLevel.label).toBe("宗师 (ELO ~2800)");
    expect(lastLevel.depth).toBe(20);
    expect(lastLevel.time).toBe(4000);
  });

  test('should have correct max centipawn evaluation', () => {
    expect(MAX_CENTIPAWN_EVAL).toBe(800);
  });

  test('should have correct default settings', () => {
    expect(DEFAULT_SETTINGS.gameMode).toBe('local');
    expect(DEFAULT_SETTINGS.aiDifficulty).toBe(1);
    expect(DEFAULT_SETTINGS.boardOrientation).toBe('white');
    expect(DEFAULT_SETTINGS.whiteAIDifficulty).toBe(1);
    expect(DEFAULT_SETTINGS.blackAIDifficulty).toBe(2);
    expect(DEFAULT_SETTINGS.playerColor).toBe('w');
  });
});