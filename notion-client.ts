import { Client } from "@notionhq/client";

const notionApi = new Client({
  auth: process.env["NOTION_API_TOKEN"],
});

const fetchPagesFromDatabase = async (database_id: string) => {
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
            before: "2024-05-02",
          },
        },
      ],
    },
  });
  console.log(response.results);
  return response.results;
};

const fetchBlocksFromPage = async (pageId: string) => {
  const response = await notionApi.blocks.children.list({ block_id: pageId });
  return response.results;
};

export const main = async () => {
  const pages = await fetchPagesFromDatabase(process.env["NOTION_DB_ID"] ?? "");
  const pageIds = pages.map((page) => page.id);
  const texts = await Promise.all(
    pageIds.map(async (pageId) => {
      const blocks = await fetchBlocksFromPage(pageId);
      return blocks;
    })
  );
  console.log(texts);
};

main();
