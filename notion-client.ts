import { Client } from "@notionhq/client";
import {
  BlockObjectResponse,
  CheckboxPropertyItemObjectResponse,
  DatePropertyItemObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
  SelectPropertyItemObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { parseRichText, retrievePlainTextByBlock } from "./helpers";

const notionApi = new Client({
  auth: process.env["NOTION_API_TOKEN"],
});

const fetchPagesByDatabase = async (database_id: string) => {
  const response = await notionApi.databases.query({
    database_id,
    filter: {
      and: [
        {
          property: "Date",
          date: {
            on_or_after: "2024-05-01",
          },
        },
        {
          property: "Date",
          date: {
            before: "2024-05-31",
          },
        },
      ],
    },
  });
  // console.log(response.results);
  return response.results;
};

const fetchBlocksByPage = async (pageId: string) => {
  const response = await notionApi.blocks.children.list({ block_id: pageId });
  return response.results;
};

type JournalProperties = {
  Date: DatePropertyItemObjectResponse;
  Feeling: SelectPropertyItemObjectResponse;
  English: CheckboxPropertyItemObjectResponse;
  Exercise: CheckboxPropertyItemObjectResponse;
  Notes: {
    id: string;
    type: "rich_text";
    rich_text: RichTextItemResponse[];
  }; // 実際のデータと型が異なるので自前で定義
};

export const fetchPagesText = async () => {
  const pages = await fetchPagesByDatabase(process.env["NOTION_DB_ID"] ?? "");
  const texts = await Promise.all(
    pages.map(async (_page) => {
      const page = _page as PageObjectResponse;
      const properties = page.properties as unknown as JournalProperties;
      const date = properties.Date.date?.start || "";
      const feeling = properties.Feeling.select?.name || "";
      const english = properties.English.checkbox || false;
      const exercise = properties.Exercise.checkbox || false;
      const notes = parseRichText(properties.Notes.rich_text);
      const blocks = await fetchBlocksByPage(page.id);
      const contents = blocks
        .map((block) => retrievePlainTextByBlock(block as BlockObjectResponse))
        .join("\n");
      return `
日付: ${date}
気分: ${feeling}
英語した: ${english ? "Yes" : "No"}
運動した: ${exercise ? "Yes" : "No"}
ノート: ${notes}
本文:
${contents}
-------------------------`;
    })
  );
  console.log(texts.join("\n"));
  return texts.join("\n");
};
// fetchPagesText();
