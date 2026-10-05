import { GROQ_MODEL } from "./groq.js";

interface AICostInput {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

interface AICostResult {
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

/**
 * Pricing is expressed as USD per 1 million tokens.
 *
 * IMPORTANT:
 * Keep these values in one place so pricing can be
 * updated without changing the intelligence logic.
 */
const MODEL_PRICING: Record<
  string,
  {
    inputPerMillion: number;
    outputPerMillion: number;
  }
> = {
  [GROQ_MODEL]: {
    inputPerMillion: 0,
    outputPerMillion: 0,
  },
};

export function calculateAICost({
  model,
  inputTokens,
  outputTokens,
}: AICostInput): AICostResult {
  const pricing = MODEL_PRICING[model];

  if (!pricing) {
    throw new Error(
      `AI pricing not configured for model: ${model}`,
    );
  }

  const inputCost =
    (inputTokens / 1_000_000) *
    pricing.inputPerMillion;

  const outputCost =
    (outputTokens / 1_000_000) *
    pricing.outputPerMillion;

  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
  };
}