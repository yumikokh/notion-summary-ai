import OpenAPI from "openai";
import { fetchPagesText } from "./notion-client";
import { Command } from "commander";
import { endMonth, startMonth } from "./helpers/date";

const openai = new OpenAPI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const program = new Command();
program
  .option("-f, --from <fromDate>", "開始日 (例: 2024-07-01), 省略時は今月1日")
  .option(
    "-t, --to <toDate>",
    "終了日 (例: 2024-07-31), 省略時は開始日の月末まで"
  )
  .option("-p, --prompt <prompt>", "プロンプト文");

program.parse(process.argv);

const { from: fromDate, to: toDate, prompt } = program.opts();

const main = async () => {
  const promptText = prompt || "要約してください。";
  const from = fromDate ? new Date(fromDate) : startMonth(new Date());
  const to = toDate ? new Date(toDate) : endMonth(from);
  const notionText = await fetchPagesText(from, to);
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
