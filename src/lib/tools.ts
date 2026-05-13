export interface ToolItem {
  href: string;
  label: string;
}

export interface ToolGroup {
  group: string;
  items: ToolItem[];
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    group: "Core",
    items: [
      { href: "/", label: "File Converter" },
      { href: "/json", label: "JSON Tools" },
    ],
  },
  {
    group: "Encoding",
    items: [
      { href: "/base64", label: "Base64" },
      { href: "/html", label: "HTML Entities" },
      { href: "/hash", label: "Hash Generator" },
    ],
  },
  {
    group: "Auth & Tokens",
    items: [
      { href: "/jwt", label: "JWT Decoder" },
      { href: "/jwt-builder", label: "JWT Builder" },
      { href: "/password", label: "Password Generator" },
      { href: "/uuid", label: "UUID Generator" },
    ],
  },
  {
    group: "Data",
    items: [
      { href: "/csv", label: "CSV ↔ JSON" },
      { href: "/url", label: "URL Parser" },
      { href: "/timestamp", label: "Timestamp" },
      { href: "/base", label: "Base Converter" },
      { href: "/color", label: "Color Converter" },
      { href: "/size", label: "Size Converter" },
    ],
  },
  {
    group: "Text & Code",
    items: [
      { href: "/regex", label: "Regex Tester" },
      { href: "/diff", label: "Text Diff" },
      { href: "/cron", label: "Cron Parser" },
      { href: "/case", label: "String Case" },
      { href: "/markdown", label: "Markdown Preview" },
      { href: "/lorem", label: "Lorem Ipsum" },
    ],
  },
];

export const ALL_TOOLS: ToolItem[] = TOOL_GROUPS.flatMap((g) => g.items);
