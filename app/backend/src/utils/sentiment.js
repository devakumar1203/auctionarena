/**
 * Simple keyword-based sentiment analysis for review comments.
 * Returns a score between 0 (very negative) and 1 (very positive).
 * 0.5 = neutral.
 */

const POSITIVE_WORDS = new Set([
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
  'perfect', 'love', 'best', 'happy', 'satisfied', 'reliable', 'trustworthy',
  'honest', 'smooth', 'fast', 'quick', 'professional', 'quality', 'genuine',
  'recommended', 'recommend', 'superb', 'outstanding', 'exceptional', 'impressive',
  'pleasant', 'friendly', 'helpful', 'responsive', 'prompt', 'timely', 'fair',
  'decent', 'nice', 'thank', 'thanks', 'appreciate', 'beautiful', 'clean',
  'accurate', 'legit', 'legitimate', 'worth', 'worthwhile', 'valuable',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'worst', 'poor', 'disappointing',
  'disappointed', 'scam', 'fraud', 'fake', 'dishonest', 'unreliable', 'slow',
  'late', 'broken', 'damaged', 'defective', 'waste', 'avoid', 'never',
  'angry', 'rude', 'unprofessional', 'liar', 'cheat', 'cheap', 'overpriced',
  'misleading', 'inaccurate', 'wrong', 'issue', 'problem', 'complaint',
  'refund', 'regret', 'hate', 'ugly', 'dirty', 'useless', 'worthless',
  'suspicious', 'sketchy', 'shady',
]);

/**
 * Analyze sentiment of a single comment.
 * @param {string} text - The comment text
 * @returns {number} Score between 0 and 1
 */
function analyzeSentiment(text) {
  if (!text || typeof text !== 'string') return 0.5;

  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    if (POSITIVE_WORDS.has(word)) positiveCount++;
    if (NEGATIVE_WORDS.has(word)) negativeCount++;
  }

  const total = positiveCount + negativeCount;
  if (total === 0) return 0.5; // neutral

  // Score: 0 = all negative, 1 = all positive
  return positiveCount / total;
}

/**
 * Analyze sentiment across multiple comments.
 * @param {string[]} comments - Array of comment strings
 * @returns {number} Average sentiment score between 0 and 1
 */
function analyzeMultipleSentiments(comments) {
  if (!comments || comments.length === 0) return 0.5;

  const total = comments.reduce((sum, c) => sum + analyzeSentiment(c), 0);
  return total / comments.length;
}

module.exports = { analyzeSentiment, analyzeMultipleSentiments };
