import fs from "fs";
import path from "path";
import readline from "readline";
import dotenv from "dotenv";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const questions = [
  "Enter your OPENAI_API_KEY: ",
  "Enter your NOTION_API_TOKEN: ",
  "Enter your NOTION_DATABASE_ID: ",
];

const envFilePath = path.join(__dirname, ".env");
const backupFilePath = path.join(__dirname, ".env.backup");

const askQuestions = (questions: string[]) => {
  let index = 0;

  const askNextQuestion = () => {
    // 中断したらもとに戻す
    if (index < questions.length) {
      rl.question(questions[index], (answer) => {
        const envKey = questions[index].split(" ")[2].slice(0, -1);
        fs.appendFileSync(envFilePath, `${envKey}=${answer}\n`);
        index++;
        askNextQuestion();
      });
    } else {
      rl.close();
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
  askQuestions(questions);
} else {
  // 上書きするかを聞く
  rl.question(
    ".env file already exists. Do you want to overwrite it? (y/n): ",
    (answer) => {
      if (answer === "n") {
        rl.close();
        return;
      }
      // .envを作成
      fs.writeFileSync(envFilePath, "");
      askQuestions(questions);
    }
  );
}

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
