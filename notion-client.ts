import { Client } from "@notionhq/client";

const notionApi = new Client({
  auth: process.env["NOTION_API_TOKEN"],
});

export const main = async () => {
  const response = await notionApi.databases.query({
    database_id: process.env["NOTION_DB_ID"] ?? "",
    filter: {
      and: [
        {
          property: "Date",
          date: {
            after: "2024-05-01",
          },
        },
        {
          property: "Date",
          date: {
            before: "2024-05-03",
          },
        },
      ],
    },
  });
  const pageIds = response.results.map(({ id }) => id);
  const pages = await Promise.all(
    pageIds.map(
      async (pageId) =>
        await notionApi.blocks.children.list({ block_id: pageId })
    )
  );
  // console.log(response);
  console.log(
    pages.map((blockList) => blockList.results.flat().map((result) => result))
  );
};

main();
