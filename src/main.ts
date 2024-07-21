import OpenAPI from "openai";
import { fetchPagesText } from "./notion-client";
import { Command } from "commander";

const openai = new OpenAPI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const program = new Command();
program
  .option("-s, --start <startDate>", "開始日 (例: 2024-07-01), 省略時は今月1日")
  .option(
    "-e, --end <endDate>",
    "終了日 (例: 2024-07-31), 省略時は開始日の月末まで"
  )
  .option("-p, --prompt <prompt>", "プロンプト文");

program.parse(process.argv);

const { start: startDate, end: endDate, prompt } = program.opts();

const main = async () => {
  const promptText = prompt || "要約してください。";
  const notionText = await fetchPagesText(
    startDate && new Date(startDate),
    endDate && new Date(endDate)
  );
  const content = `
${promptText}
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
