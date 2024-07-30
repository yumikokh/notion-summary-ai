import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { program } from "commander";
import { askQuestion, rl } from "./helpers/readline";

dotenv.config();

const ENV_KEYS = ["OPENAI_API_KEY", "NOTION_API_TOKEN", "NOTION_DATABASE_ID"];
const questions = ENV_KEYS.map((key) => `Enter your ${key}: `);

const envFilePath = path.join(__dirname, "../", ".env");
const backupFilePath = path.join(__dirname, "../", ".env.backup");

program
  .option("-l, --list", "List the environment variables that need to be set up")
  .parse(process.argv);

const options = program.opts();
if (options.list) {
  if (fs.existsSync(envFilePath)) {
    const envData = fs.readFileSync(envFilePath, "utf8");
    console.info(`Current environment variables:
${envData}`);
  } else {
    console.info(".env file does not exist.");
  }
  process.exit(0);
}

// .envファイルから現在の設定を読み込む
const currentEnv = dotenv.parse(fs.readFileSync(envFilePath, "utf8"));
const newEnv = { ...currentEnv };

const askQuestions = (questions: string[]) => {
  let index = 0;

  const askNextQuestion = async () => {
    // 中断したらもとに戻す
    if (index < questions.length) {
      const envKey = ENV_KEYS[index];
      const currentEnvValue = currentEnv[envKey];
      if (currentEnvValue) {
        // 値があったら上書きするか聞く
        const yesOrNo = await askQuestion(
          `The current value of ${envKey} is "${currentEnvValue}". Do you want to overwrite it? (y/n): `
        );

        if (yesOrNo === "n") {
          newEnv[envKey] = currentEnvValue;
          index++;
          await askNextQuestion();
          return;
        } else if (yesOrNo === "y") {
          const answerValue = await askQuestion(questions[index]);
          newEnv[envKey] = answerValue;
          index++;
          await askNextQuestion();
          return;
        }
        // pink
        console.info("Please enter 'y' or 'n'.");
        await askNextQuestion();
        return;
      }

      // 値がなかったら新しく入力
      const answerValue = await askQuestion(questions[index]);
      newEnv[envKey] = answerValue;
      console.info(`Your ${envKey} is set to "${answerValue}".`);
      index++;
      await askNextQuestion();
      return;
    }

    // 全ての質問が終わったら質問を終了
    rl.close();

    // .envファイルに書き込む
    const envContent = Object.entries(newEnv)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
    fs.writeFileSync(envFilePath, envContent);
    console.info("Environment variables have been set up.");

    // バックアップファイルを削除
    if (fs.existsSync(backupFilePath)) {
      fs.unlinkSync(backupFilePath);
    }
  };

  askNextQuestion();
};

// .envファイルのバックアップを作成
if (fs.existsSync(envFilePath)) {
  fs.copyFileSync(envFilePath, backupFilePath);
}

if (!fs.existsSync(envFilePath)) {
  // .envを作成
  fs.writeFileSync(envFilePath, "");
}
askQuestions(questions);

rl.on("SIGINT", () => {
  console.info("\nProcess interrupted. Restoring the original .env file.");
  // バックアップファイルから.envファイルを復元
  if (fs.existsSync(backupFilePath)) {
    fs.copyFileSync(backupFilePath, envFilePath);
    fs.unlinkSync(backupFilePath);
    console.info(".env file restored from backup.");
  }
  rl.close();
  process.exit(0);
});
