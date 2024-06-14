import {
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

import { match, P } from "ts-pattern";

const retrievePlainTextByRichText = (richText: RichTextItemResponse[]) => {
  return richText.map((text) => text.plain_text).join(" ");
};

export const retrievePlainTextByBlock = (block: BlockObjectResponse) => {
  return match(block)
    .with(
      { type: "paragraph", paragraph: { rich_text: P.select() } },
      retrievePlainTextByRichText
    )
    .with(
      { type: "heading_1", heading_1: { rich_text: P.select() } },
      retrievePlainTextByRichText
    )
    .with(
      { type: "heading_2", heading_2: { rich_text: P.select() } },
      retrievePlainTextByRichText
    )
    .with(
      { type: "heading_3", heading_3: { rich_text: P.select() } },
      retrievePlainTextByRichText
    )
    .with(
      {
        type: "bulleted_list_item",
        bulleted_list_item: { rich_text: P.select() },
      },
      retrievePlainTextByRichText
    )
    .with(
      {
        type: "numbered_list_item",
        numbered_list_item: { rich_text: P.select() },
      },
      retrievePlainTextByRichText
    )
    .with(
      { type: "quote", quote: { rich_text: P.select() } },
      retrievePlainTextByRichText
    )
    .with(
      { type: "to_do", to_do: { rich_text: P.select() } },
      retrievePlainTextByRichText
    )
    .with(
      { type: "toggle", toggle: { rich_text: P.select() } },
      retrievePlainTextByRichText
    )

    .with(
      { type: "template", template: { rich_text: P.select() } },
      retrievePlainTextByRichText
    )
    .with(
      { type: "code", code: { rich_text: P.select() } },
      retrievePlainTextByRichText
    )
    .with(
      { type: "callout", callout: { rich_text: P.select() } },
      retrievePlainTextByRichText
    )
    .with({ type: "table_row", table_row: { cells: P.select() } }, (cell) =>
      cell.map(retrievePlainTextByRichText).join("|")
    )
    .with({ type: "embed", embed: { url: P.select() } }, (url) => url)
    .with(
      { type: "bookmark", bookmark: P.select() },
      ({ url, caption }) => `${caption} : ${url}`
    )
    .with(
      {
        type: "link_preview",
        link_preview: P.select(),
      },
      ({ url }) => url
    )
    .with(
      { type: "synced_block" },
      { type: "child_page" },
      { type: "child_database" },
      { type: "equation" },
      { type: "table_of_contents" },
      { type: "column_list" },
      { type: "column" },
      { type: "link_to_page" },
      { type: "table" },
      { type: "image" },
      { type: "video" },
      { type: "pdf" },
      { type: "file" },
      { type: "audio" },
      { type: "breadcrumb" },
      { type: "divider" },
      { type: "unsupported" },
      () => ""
    )
    .exhaustive();
};
