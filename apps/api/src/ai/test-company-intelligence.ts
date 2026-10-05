import { analyzeCompany } from "./company-intelligence.service.js";

async function main() {
  const result = await analyzeCompany({
    name: "OpenAI",
    websiteUrl: "https://openai.com",
    description: "AI research and deployment company",
    industry: "AI / Generative AI",
  });

  console.log(
    JSON.stringify(result, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});