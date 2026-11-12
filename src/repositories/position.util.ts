export const computeFinalPosition = (
  score: number,
  allScores: number[],
): number => {
  const countHigher = allScores.filter((s) => s > score).length;
  const countLower = allScores.filter((s) => s < score).length;
  return Math.round(((countHigher - countLower + 5) / 2.0) * 10) / 10;
};
