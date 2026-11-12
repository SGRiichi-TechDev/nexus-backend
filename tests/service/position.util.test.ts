import { computeFinalPosition } from '#repositories/position.util.js';
import { describe, expect, it } from 'vitest';

describe('computeFinalPosition', () => {
  it('assigns 1–4 for four distinct scores', () => {
    const scores = [350, 280, 220, 150];
    expect(computeFinalPosition(350, scores)).toBe(1);
    expect(computeFinalPosition(280, scores)).toBe(2);
    expect(computeFinalPosition(220, scores)).toBe(3);
    expect(computeFinalPosition(150, scores)).toBe(4);
  });

  it('assigns 2.5 when all scores tie', () => {
    const scores = [250, 250, 250, 250];
    for (const score of scores) {
      expect(computeFinalPosition(score, scores)).toBe(2.5);
    }
  });

  it('handles two-way tie for first place', () => {
    const scores = [300, 300, 200, 100];
    expect(computeFinalPosition(300, scores)).toBe(1.5);
    expect(computeFinalPosition(200, scores)).toBe(3);
    expect(computeFinalPosition(100, scores)).toBe(4);
  });

  it('works with negative scores', () => {
    const scores = [-10, -20, -30, -40];
    expect(computeFinalPosition(-10, scores)).toBe(1);
    expect(computeFinalPosition(-40, scores)).toBe(4);
  });
});
