import { APIResponseError, Client } from "@notionhq/client";
import { parseBlock, parseProperties } from "./helpers/notion";
import { formatDate } from "./helpers/date";
import dotenv from "dotenv";

dotenv.config();

if (!process.env["NOTION_API_TOKEN"]) {
  console.error("NOTION_API_TOKEN is not set");
  process.exit(1);
}

const notionApi = new Client({
  auth: process.env["NOTION_API_TOKEN"],
});

/**
 * 指定したデータベースから指定した期間のページを取得する
 * @param database_id データベースID
 * @param from 開始日
 * @param to 終了日
 */
const fetchPagesByDatabase = async (
  database_id: string,
  from: Date,
  to: Date
) => {
  const fromStr = formatDate(from);
  const toStr = formatDate(to);

  try {
    const response = await notionApi.databases.query({
      database_id,
      sorts: [
        {
          property: "Date",
          direction: "ascending",
        },
      ],
      filter: {
        and: [
          {
            property: "Date",
            date: {
              on_or_after: fromStr,
            },
          },
          {
            property: "Date",
            date: {
              before: toStr,
            },
          },
        ],
      },
    });
    // console.log(response.results);
    return response.results;
  } catch (error) {
    if (error instanceof APIResponseError) {
      throw new Error(error.message);
    }
    console.error(error);
    throw new Error();
  }
};

/**
 * 指定したページの子ブロックを取得する
 * @param pageId ページID
 */
const fetchBlocksByPage = async (pageId: string) => {
  try {
    const response = await notionApi.blocks.children.list({ block_id: pageId });
    return response.results;
  } catch (error) {
    if (error instanceof APIResponseError) {
      throw new Error(error.message);
    }
    console.error(error);
    throw new Error();
  }
};

/**
 * 指定した期間のページのテキストを取得する
 * @param databaseId データベースID
 * @param from 開始日
 * @param to 終了日
 */
const fetchPagesContents = async (databaseId: string, from: Date, to: Date) => {
  try {
    const pages = await fetchPagesByDatabase(databaseId, from, to);

    const texts = await Promise.all(
      pages.flatMap(async (page) => {
        if (page.object !== "page") {
          return [];
        }

        let text: string = "";

        if ("properties" in page) {
          text += parseProperties(page.properties).join("\n");
        }

        const blocks = await fetchBlocksByPage(page.id);

        text += "\nContents:\n";
        text += blocks
          .map((block) => {
            if ("type" in block) {
              return parseBlock(block);
            }
            return null;
          })
          .filter((text) => text !== null)
          .join("\n");
        text += "\n-------------------------";

        return text;
      })
    );

    return texts.join("\n");
  } catch (error) {
    if (error instanceof APIResponseError) {
      throw new Error(error.message);
    }
    console.error(error);
    throw new Error();
  }
};

export { fetchPagesContents };
