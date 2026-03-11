import type { Meal } from './meals.types';
import type { AgentMealProposal, SimilarMealResult } from '@lib/chat/agent-actions.types';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'with', 'and', 'or', 'for', 'of', 'in', 'on', 'at', 'to',
  'is', 'it', 'my', 'your', 'this', 'that', 'from', 'by', 'as',
]);

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function wordOverlapScore(a: string, b: string): number {
  const wordsA = new Set(normalizeWords(a));
  const wordsB = new Set(normalizeWords(b));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  return intersection / Math.min(wordsA.size, wordsB.size);
}

/**
 * Returns a 0–1 similarity score between a proposed meal and an existing meal.
 * Score >= 0.5 is considered "similar enough to flag."
 */
export function computeMealSimilarity(
  proposedTitle: string,
  proposedDescription: string,
  existingTitle: string,
  existingDescription: string,
): number {
  const titleNorm = proposedTitle.toLowerCase().trim();
  const existingNorm = existingTitle.toLowerCase().trim();

  if (titleNorm === existingNorm) return 1.0;

  if (titleNorm.includes(existingNorm) || existingNorm.includes(titleNorm)) return 0.8;

  const titleScore = wordOverlapScore(proposedTitle, existingTitle);
  const descScore = wordOverlapScore(proposedDescription, existingDescription);

  return titleScore * 0.7 + descScore * 0.3;
}

export const MEAL_SIMILARITY_THRESHOLD = 0.5;

/**
 * Returns one SimilarMealResult per proposed meal where a similar existing meal is found.
 * Only the best match per proposal is returned.
 */
export function findSimilarMeals(
  proposals: AgentMealProposal[],
  existingMeals: Meal[],
): SimilarMealResult[] {
  const results: SimilarMealResult[] = [];

  for (const proposal of proposals) {
    let bestScore = 0;
    let bestMatch: Meal | null = null;

    for (const existing of existingMeals) {
      const score = computeMealSimilarity(
        proposal.title,
        proposal.description,
        existing.title,
        existing.description,
      );
      if (score > bestScore) {
        bestScore = score;
        bestMatch = existing;
      }
    }

    if (bestMatch && bestScore >= MEAL_SIMILARITY_THRESHOLD) {
      results.push({
        proposedTitle: proposal.title,
        existingId: bestMatch.id,
        existingTitle: bestMatch.title,
        similarity: bestScore,
      });
    }
  }

  return results;
}
