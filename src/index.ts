import OpenAPI from "openai";
import { fetchPagesContents } from "./notion-client";
import { Command } from "commander";
import { endMonth, startMonth } from "./helpers/date";

const program = new Command();
program
  .requiredOption("-d, --database <databaseId>", "データベースID")
  .option("-f, --from <fromDate>", "開始日 (例: 2024-07-01), 省略時は今月1日")
  .option(
    "-t, --to <toDate>",
    "終了日 (例: 2024-07-31), 省略時は開始日の月末まで"
  )
  .option("-p, --prompt <prompt>", "プロンプト文")
  .option(
    "--dry-run",
    "OPENAI APIを実行せずにプロンプトとNotionから取得したコンテンツを表示する"
  )
  .parse(process.argv);

const {
  database: databaseId,
  from: fromDate,
  to: toDate,
  prompt,
  dryRun,
} = program.opts();

if (!process.env["OPENAI_API_KEY"] && !dryRun) {
  console.error("OPENAI_API_KEY is not set");
  process.exit(1);
}

const main = async () => {
  const promptText = prompt || "要約してください。";
  const from = fromDate ? new Date(fromDate) : startMonth(new Date());
  const to = toDate ? new Date(toDate) : endMonth(from);
  const notionContents = await fetchPagesContents(databaseId, from, to);

  const content = `
  プロンプト: ${promptText}
  ----------
  
  ${notionContents}`;

  if (dryRun) {
    console.log(content);
    return;
  }

  const openai = new OpenAPI({
    apiKey: process.env["OPENAI_API_KEY"],
  });

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
