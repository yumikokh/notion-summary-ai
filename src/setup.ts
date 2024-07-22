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
];

const envFilePath = path.join(__dirname, ".env");

const askQuestions = (questions: string[]) => {
  let index = 0;

  const askNextQuestion = () => {
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
    }
  };

  askNextQuestion();
};

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
      askQuestions(questions);
    }
  );
}
