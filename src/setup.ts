import fs from "fs";
import path from "path";
import readline from "readline";
import dotenv from "dotenv";
import { program } from "commander";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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
    console.log(`Current environment variables:
${envData}`);
  } else {
    console.log(".env file does not exist.");
  }
  process.exit(0);
}

// .envファイルから現在の設定を読み込む
const currentEnv = dotenv.parse(fs.readFileSync(envFilePath, "utf8"));
const newEnv = { ...currentEnv };

const askQuestions = (questions: string[]) => {
  let index = 0;

  const askNextQuestion = () => {
    // 中断したらもとに戻す
    if (index < questions.length) {
      const envKey = ENV_KEYS[index];
      const currentEnvValue = currentEnv[envKey];
      // 値があったら上書きするか聞く
      if (currentEnvValue) {
        rl.question(
          `The current value of ${envKey} is "${currentEnvValue}". Do you want to overwrite it? (y/n): `,
          (answer) => {
            if (answer === "n") {
              newEnv[envKey] = currentEnvValue;
            } else {
              rl.question(questions[index], (newValue) => {
                newEnv[envKey] = newValue;
              });
            }
            index++;
            askNextQuestion();
          }
        );
      } else {
        rl.question(questions[index], (answer) => {
          newEnv[envKey] = answer;
          index++;
          askNextQuestion();
        });
      }
    } else {
      rl.close();

      // .envファイルに書き込む
      const envContent = Object.entries(newEnv)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
      fs.writeFileSync(envFilePath, envContent);

      console.log("Environment variables have been set up.");
      // バックアップファイルを削除
      if (fs.existsSync(backupFilePath)) {
        fs.unlinkSync(backupFilePath);
      }
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
  console.log("\nProcess interrupted. Restoring the original .env file.");
  // バックアップファイルから.envファイルを復元
  if (fs.existsSync(backupFilePath)) {
    fs.copyFileSync(backupFilePath, envFilePath);
    fs.unlinkSync(backupFilePath);
    console.log(".env file restored from backup.");
  }
  rl.close();
  process.exit(0);
});
