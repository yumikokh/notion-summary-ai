import OpenAPI from "openai";

const openai = new OpenAPI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const main = async () => {
  const content =
    "This package is compatible with server-side V8 contexts such as Node.js, Deno, and Cloudflare Workers.を訳して";
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
