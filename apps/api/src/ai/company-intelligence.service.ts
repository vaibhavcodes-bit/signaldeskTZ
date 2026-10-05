import { z } from "zod";
import { groq, GROQ_MODEL } from "./groq.js";

/**
 * ============================================================
 * COMPANY INTELLIGENCE SCHEMA
 * ============================================================
 */

export const companyIntelligenceSchema = z.object({
  summary: z.string(),

  industry: z.string(),

  businessModel: z.string(),

  targetCustomers: z.array(z.string()),

  productsOrServices: z.array(z.string()),

  technologies: z.array(z.string()),

  growthSignals: z.array(z.string()),

  potentialOpportunities: z.array(z.string()),

  confidence: z.number().min(0).max(1),
});

/**
 * Inferred TypeScript type from Zod schema.
 */
export type CompanyIntelligence = z.infer<
  typeof companyIntelligenceSchema
>;

/**
 * ============================================================
 * ANALYZE COMPANY RESULT
 * ============================================================
 */

export interface AnalyzeCompanyResult {
  intelligence: CompanyIntelligence;

  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

/**
 * ============================================================
 * INPUT
 * ============================================================
 */

interface AnalyzeCompanyInput {
  name: string;
  websiteUrl: string;
  description: string;
  industry: string;
}

/**
 * ============================================================
 * ANALYZE COMPANY
 * ============================================================
 */

export async function analyzeCompany(
  input: AnalyzeCompanyInput,
): Promise<AnalyzeCompanyResult> {
  /**
   * ----------------------------------------------------------
   * 1. Call Groq
   * ----------------------------------------------------------
   */

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,

    temperature: 0.2,

    messages: [
      {
        role: "system",

        content: `
You are a company intelligence analyst.

Analyze the company information provided by the user.

Return ONLY valid JSON.

Required JSON structure:

{
  "summary": "string",
  "industry": "string",
  "businessModel": "string",
  "targetCustomers": ["string"],
  "productsOrServices": ["string"],
  "technologies": ["string"],
  "growthSignals": ["string"],
  "potentialOpportunities": ["string"],
  "confidence": 0.0
}

Rules:

1. Do not invent facts.
2. Use only information available in the input.
3. If information is unavailable, use an empty array or a cautious statement.
4. confidence must be between 0 and 1.
5. Return JSON only.
        `.trim(),
      },

      {
        role: "user",

        content: JSON.stringify(input),
      },
    ],
  });

  /**
   * ----------------------------------------------------------
   * 2. Extract AI response
   * ----------------------------------------------------------
   */

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty response");
  }

  /**
   * ----------------------------------------------------------
   * 3. Parse JSON
   * ----------------------------------------------------------
   */

  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Groq returned invalid JSON");
  }

  /**
   * ----------------------------------------------------------
   * 4. Validate AI response using Zod
   * ----------------------------------------------------------
   */

  const result = companyIntelligenceSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(
      `Invalid company intelligence response: ${result.error.message}`,
    );
  }

  /**
   * ----------------------------------------------------------
   * 5. Extract token usage
   * ----------------------------------------------------------
   */

  const inputTokens = response.usage?.prompt_tokens ?? 0;

  const outputTokens =
    response.usage?.completion_tokens ?? 0;

  const totalTokens =
    response.usage?.total_tokens ??
    inputTokens + outputTokens;

  /**
   * ----------------------------------------------------------
   * 6. Return intelligence + usage
   * ----------------------------------------------------------
   */

  return {
    intelligence: result.data,

    usage: {
      inputTokens,
      outputTokens,
      totalTokens,
    },
  };
}