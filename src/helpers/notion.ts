import {
  BlockObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

import { match, P } from "ts-pattern";

/**
 * リッチテキストをプレーンテキストに変換する
 */
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

/**
 * ブロックをプレーンテキストに変換する
 */
const parseBlock = (block: BlockObjectResponse): string => {
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
      cell
        .map((richText) => parseRichText(richText, { separator: "|" }))
        .join("/n")
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

type Property = PageObjectResponse["properties"][string];
type WithoutId<T> = T extends { id: string } ? Omit<T, "id"> : T;

/**
 * プロパティをプレーンテキストに変換する
 */
const parseProperty = (property: WithoutId<Property>): string | number | null =>
  match(property)
    .with({ type: "title" }, (value) => {
      return parseRichText(value.title);
    })
    .with({ type: "number" }, (value) => {
      if (value.number === null) return null;
      return value.number;
    })
    .with({ type: "url" }, (value) => {
      if (value.url === null) return null;
      return value.url;
    })
    .with({ type: "select" }, (value) => {
      if (value.select === null) return null;
      return value.select.name;
    })
    .with({ type: "multi_select" }, (value) => {
      if (value.multi_select.length === 0) return null;
      return value.multi_select.map((v) => v.name).join(", ");
    })
    .with({ type: "status" }, (value) => {
      if (value.status === null) return null;
      return value.status.name;
    })
    .with({ type: "date" }, (value) => {
      if (value.date === null) return null;
      return value.date.start;
    })
    .with({ type: "email" }, (value) => {
      if (value.email === null) return null;
      return value.email;
    })
    .with({ type: "phone_number" }, (value) => {
      if (value.phone_number === null) return null;
      return value.phone_number;
    })
    .with({ type: "checkbox" }, (value) => {
      return value.checkbox ? "Yes" : "No";
    })
    .with({ type: "rich_text" }, (value) => {
      return parseRichText(value.rich_text);
    })
    .with({ type: "rollup" }, (value) => {
      if (value.rollup.type === "array") {
        return value.rollup.array
          .map((v) => parseProperty(v))
          .filter((v) => v !== null)
          .join(", ");
      }
      return parseProperty(value.rollup);
    })
    .with(
      { type: "files" },
      { type: "created_by" },
      { type: "created_time" },
      { type: "last_edited_by" },
      { type: "last_edited_time" },
      { type: "formula" },
      { type: "button" },
      { type: "unique_id" },
      { type: "verification" },
      { type: "people" },
      { type: "relation" },
      () => null
    )
    .exhaustive();

/**
 * ページプロパティをプレーンテキストに変換する
 */
const parseProperties = (
  properties: PageObjectResponse["properties"]
): string[] => {
  return Object.entries(properties)
    .map(([key, property]) => {
      const value = parseProperty(property);
      return value !== null ? `${key}: ${value}` : null;
    })
    .filter((v) => v !== null);
};

export { parseBlock, parseProperties };
