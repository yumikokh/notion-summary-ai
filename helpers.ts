import {
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

import { match, P } from "ts-pattern";

const parseRichText = (
  richTexts: RichTextItemResponse[],
  option: { prefix?: string; separator?: string } = { separator: " " }
) => {
  if (option.prefix) {
    return `${option.prefix} ${richTexts
      .map((text) => text.plain_text)
      .join(option.separator)}`;
  }
  return richTexts.map((text) => text.plain_text).join(option.separator);
};

export const retrievePlainTextByBlock = (block: BlockObjectResponse) => {
  return match(block)
    .with(
      { type: "paragraph", paragraph: { rich_text: P.select() } },
      (richText) => parseRichText(richText)
    )
    .with(
      { type: "heading_1", heading_1: { rich_text: P.select() } },
      (richText) => parseRichText(richText, { prefix: "#" })
    )
    .with(
      { type: "heading_2", heading_2: { rich_text: P.select() } },
      (richText) => parseRichText(richText, { prefix: "##" })
    )
    .with(
      { type: "heading_3", heading_3: { rich_text: P.select() } },
      (richText) => parseRichText(richText, { prefix: "###" })
    )
    .with(
      {
        type: "bulleted_list_item",
        bulleted_list_item: { rich_text: P.select() },
      },
      (richText) => parseRichText(richText, { prefix: "-" })
    )
    .with(
      {
        type: "numbered_list_item",
        numbered_list_item: { rich_text: P.select() },
      },
      (richText) => parseRichText(richText, { prefix: `1.` })
    )
    .with({ type: "quote", quote: { rich_text: P.select() } }, (richText) =>
      parseRichText(richText, { prefix: ">" })
    )
    .with({ type: "to_do", to_do: { rich_text: P.select() } }, (richText) =>
      parseRichText(richText, { prefix: "-" })
    )
    .with({ type: "toggle", toggle: { rich_text: P.select() } }, (richText) =>
      parseRichText(richText, { prefix: ">" })
    )
    .with(
      { type: "template", template: { rich_text: P.select() } },
      (richText) => parseRichText(richText, { prefix: ">" })
    )
    .with({ type: "callout", callout: { rich_text: P.select() } }, (richText) =>
      parseRichText(richText, { prefix: ">" })
    )
    .with({ type: "table_row", table_row: { cells: P.select() } }, (cell) =>
      cell.map((richText) => parseRichText(richText, { separator: "|" }))
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
      { type: "embed" },
      { type: "bookmark" },
      { type: "code" },
      { type: "link_preview" },
      { type: "unsupported" },
      () => ""
    )
    .exhaustive();
};
