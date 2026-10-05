import { groq, GROQ_MODEL } from "./groq.js";

async function main() {
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "user",
        content: "In one sentence, what does OpenAI do?",
      },
    ],
  });

  console.log(response.choices[0]?.message?.content);
}

main().catch(console.error);