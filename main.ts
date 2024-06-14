import OpenAPI from "openai";
import { fetchPagesText } from "./notion-client";

const openai = new OpenAPI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("プロンプトを入力してください");
  process.exit(1);
}
const main = async () => {
  const prompt = args[0];
  const notionText = await fetchPagesText();
  const content = `
${prompt}
${notionText}`;
  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content }],
    stream: true,
  });
  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
};

main();
