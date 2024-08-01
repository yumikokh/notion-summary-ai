import OpenAPI from "openai";
import { fetchPagesContents } from "./notion-client";
import { Command } from "commander";
import { endMonth, startMonth } from "./helpers/date";
import dotenv from "dotenv";

dotenv.config();

const program = new Command();
program
  .option("-d, --database <databaseId>", "データベースID")
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

const opts = program.opts();

if (!process.env["OPENAI_API_KEY"] && !opts.dryRun) {
  console.error("OPENAI_API_KEY is not set");
  process.exit(1);
}

if (!process.env["NOTION_DATABASE_ID"] && !opts.database) {
  console.error(
    "NOTION_DATABASE_ID is not set. Please specify with -d option or NOTION_DATABASE_ID environment variable."
  );
  process.exit(1);
}

const main = async () => {
  const promptText = opts.prompt || "要約してください。";
  const databaseId = opts.database || process.env["NOTION_DATABASE_ID"];
  const from = opts.from ? new Date(opts.from) : startMonth(new Date());
  const to = opts.to ? new Date(opts.to) : endMonth(from);
  const notionContents = await fetchPagesContents(databaseId, from, to);

  const content = `プロンプト: ${promptText}
----------
  
${notionContents}`;

  if (opts.dryRun) {
    console.log(content);
    return;
  }

  const openai = new OpenAPI({
    apiKey: process.env["OPENAI_API_KEY"],
  });

  const stream = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content }],
    stream: true,
  });
  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
};

main();
