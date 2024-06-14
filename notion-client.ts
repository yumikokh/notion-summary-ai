import { Client } from "@notionhq/client";
import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { retrievePlainTextByBlock } from "./helpers";

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
            before: "2024-05-05",
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

const main = async () => {
  const pages = await fetchPagesByDatabase(process.env["NOTION_DB_ID"] ?? "");
  const pageIds = pages.map((page) => page.id);
  const texts = await Promise.all(
    pageIds.map(async (pageId) => {
      const blocks = await fetchBlocksByPage(pageId);
      return blocks.map((block) =>
        retrievePlainTextByBlock(block as BlockObjectResponse)
      );
    })
  );
  console.log(texts);
};

main();
