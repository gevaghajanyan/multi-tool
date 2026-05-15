export interface ToolItem {
  href: string;
  label: string;
  description: string;
  keywords: string[];
}

export interface ToolGroup {
  group: string;
  items: ToolItem[];
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    group: "Core",
    items: [
      {
        href: "/files",
        label: "File Converter",
        description: "Convert video, audio & images in the browser",
        keywords: ["video", "audio", "image", "mp4", "mp3", "png", "jpg", "jpeg", "webp", "gif", "mkv", "mov", "avi", "wav", "ogg", "flac", "aac", "m4a", "convert", "ffmpeg", "compress", "transcode", "media"],
      },
      {
        href: "/json",
        label: "JSON Tools",
        description: "Format, validate, minify & diff JSON",
        keywords: ["json", "format", "prettify", "minify", "validate", "lint", "yaml", "compare", "diff", "tree", "viewer", "parse", "stringify", "pretty print"],
      },
      {
        href: "/qr",
        label: "QR Code Generator",
        description: "Generate QR codes for URLs, text & more",
        keywords: ["qr", "qr code", "qrcode", "generate", "url", "link", "barcode", "scan", "wifi", "vcard", "share", "png", "svg", "download"],
      },
      {
        href: "/resize",
        label: "Image Resize",
        description: "Resize images locally — nothing is uploaded",
        keywords: ["image", "resize", "scale", "width", "height", "png", "jpeg", "jpg", "webp", "compress", "crop", "cut", "trim", "dimensions", "photo", "picture", "thumbnail", "downscale", "upscale", "aspect ratio", "crop image", "image crop", "image cutter", "image trimmer"],
      },
      {
        href: "/chmod",
        label: "Chmod Calculator",
        description: "Build Unix file permissions visually or type an octal value",
        keywords: ["chmod", "permissions", "unix", "linux", "octal", "file permissions", "rwx", "setuid", "setgid", "sticky", "owner", "group", "755", "644", "777", "symbolic", "mode", "access"],
      },
      {
        href: "/barcode",
        label: "Barcode Generator",
        description: "Generate 1D & 2D barcodes — Code 128, EAN, QR, Data Matrix",
        keywords: ["barcode", "code128", "ean", "ean13", "ean8", "upc", "qr", "datamatrix", "pdf417", "aztec", "generate", "scan", "1d", "2d", "bwip"],
      },
    ],
  },
  {
    group: "Encoding",
    items: [
      {
        href: "/base64",
        label: "Base64",
        description: "Encode & decode Base64 strings",
        keywords: ["base64", "encode", "decode", "btoa", "atob", "binary", "string", "data uri", "image encode", "file encode"],
      },
      {
        href: "/html",
        label: "HTML Entities",
        description: "Encode & decode HTML entities",
        keywords: ["html", "entities", "escape", "unescape", "encode", "decode", "&amp;", "&lt;", "&gt;", "special characters", "xml", "xss"],
      },
      {
        href: "/hash",
        label: "Hash Generator",
        description: "Generate MD5, SHA-1, SHA-256, SHA-512 hashes",
        keywords: ["hash", "md5", "sha", "sha1", "sha256", "sha512", "checksum", "crypto", "digest", "fingerprint", "hmac", "encrypt"],
      },
    ],
  },
  {
    group: "Auth & Tokens",
    items: [
      {
        href: "/jwt",
        label: "JWT Decoder",
        description: "Decode & inspect JWT tokens",
        keywords: ["jwt", "token", "decode", "json web token", "auth", "bearer", "claims", "payload", "header", "signature", "oauth", "session"],
      },
      {
        href: "/jwt-builder",
        label: "JWT Builder",
        description: "Sign & create JWT tokens",
        keywords: ["jwt", "token", "sign", "create", "build", "generate", "json web token", "hs256", "rs256", "secret", "auth", "oauth"],
      },
      {
        href: "/password",
        label: "Password Generator",
        description: "Generate secure random passwords",
        keywords: ["password", "generate", "random", "secure", "strong", "passphrase", "credentials", "entropy", "symbols", "special chars"],
      },
      {
        href: "/uuid",
        label: "UUID / ULID",
        description: "Generate UUID v4 and ULID unique identifiers",
        keywords: ["uuid", "ulid", "guid", "unique id", "id", "generate", "random", "v4", "identifier", "sortable", "monotonic"],
      },
    ],
  },
  {
    group: "Data",
    items: [
      {
        href: "/json-to-ts",
        label: "JSON → TypeScript",
        description: "Generate TypeScript interfaces from JSON data",
        keywords: ["json", "typescript", "types", "interface", "generate", "ts", "type", "infer", "convert", "schema", "dto", "model", "definition", "json to ts", "json2ts"],
      },
      {
        href: "/yaml",
        label: "YAML ↔ JSON",
        description: "Convert between YAML and JSON",
        keywords: ["yaml", "json", "convert", "yml", "config", "serialization", "parse", "kubernetes", "docker", "compose", "ansible", "helm", "toml", "data format", "indent", "key value"],
      },
      {
        href: "/csv",
        label: "CSV ↔ JSON",
        description: "Convert between CSV and JSON",
        keywords: ["csv", "json", "convert", "spreadsheet", "excel", "table", "tsv", "delimiter", "rows", "columns", "import", "export", "data"],
      },
      {
        href: "/url",
        label: "URL Parser",
        description: "Parse, encode & decode URLs",
        keywords: ["url", "parse", "query", "params", "search params", "href", "link", "decode", "encode", "uri", "query string", "path", "hostname", "protocol", "fragment", "anchor"],
      },
      {
        href: "/timestamp",
        label: "Timestamp",
        description: "Convert Unix timestamps to dates and back",
        keywords: ["timestamp", "unix", "epoch", "date", "time", "convert", "iso", "utc", "datetime", "milliseconds", "seconds", "now", "format"],
      },
      {
        href: "/base",
        label: "Base Converter",
        description: "Convert between decimal, hex, binary & octal",
        keywords: ["base", "hex", "hexadecimal", "binary", "decimal", "octal", "convert", "radix", "number", "bit", "0x", "0b", "base 2", "base 16", "base 8", "base 10", "int"],
      },
      {
        href: "/color",
        label: "Color Converter",
        description: "Convert between HEX, RGB, HSL & more",
        keywords: ["color", "colour", "hex", "rgb", "rgba", "hsl", "hsla", "hsv", "oklch", "css", "design", "palette", "picker", "convert", "web color", "#"],
      },
      {
        href: "/size",
        label: "Size Converter",
        description: "Convert px, rem, em, vw, pt, cm, mm and more",
        keywords: ["size", "units", "px", "rem", "em", "pixel", "pixels", "pt", "pt to px", "px to rem", "rem to px", "em to px", "vw", "vh", "cm", "mm", "inch", "convert", "css units", "font size", "viewport", "responsive", "typography"],
      },
      {
        href: "/number",
        label: "Number Formatter",
        description: "Format numbers with locale, currency, units & notation",
        keywords: ["number", "format", "locale", "currency", "intl", "decimal", "percent", "compact", "scientific", "notation", "i18n", "l10n", "thousands", "separator", "usd", "eur", "gbp"],
      },
    ],
  },
  {
    group: "Text & Code",
    items: [
      {
        href: "/regex",
        label: "Regex Tester",
        description: "Test regular expressions with live highlighting",
        keywords: ["regex", "regexp", "regular expression", "pattern", "match", "test", "flags", "global", "multiline", "capture group", "lookahead", "search", "replace"],
      },
      {
        href: "/diff",
        label: "Text Diff",
        description: "Compare two texts and highlight differences",
        keywords: ["diff", "compare", "difference", "text", "side by side", "changes", "delta", "patch", "merge", "conflict", "before after"],
      },
      {
        href: "/cron",
        label: "Cron Parser",
        description: "Parse & explain cron expressions",
        keywords: ["cron", "schedule", "expression", "parse", "timer", "job", "interval", "recurring", "crontab", "task", "automation", "every"],
      },
      {
        href: "/case",
        label: "String Case",
        description: "Convert between camelCase, snake_case, PascalCase & more",
        keywords: ["case", "camel", "camelcase", "snake", "snake_case", "pascal", "pascalcase", "kebab", "kebab-case", "upper", "lowercase", "title case", "convert", "string", "naming", "transform", "screaming snake"],
      },
      {
        href: "/markdown",
        label: "Markdown Preview",
        description: "Live Markdown preview with syntax highlighting",
        keywords: ["markdown", "md", "preview", "render", "html", "document", "editor", "live", "readme", "syntax", "github markdown", "commonmark"],
      },
      {
        href: "/lorem",
        label: "Lorem Ipsum",
        description: "Generate placeholder Lorem Ipsum text",
        keywords: ["lorem", "ipsum", "placeholder", "text", "dummy", "generate", "fake", "content", "filler", "paragraphs", "words", "sentences"],
      },
      {
        href: "/md-pdf",
        label: "Markdown → PDF",
        description: "Convert Markdown to a downloadable PDF",
        keywords: ["markdown", "pdf", "convert", "export", "download", "document", "a4", "letter", "jspdf", "html", "render", "print"],
      },
      {
        href: "/svg",
        label: "SVG → PNG",
        description: "Convert SVG to PNG with custom size and scale",
        keywords: ["svg", "png", "convert", "rasterize", "export", "download", "vector", "image", "scale", "2x", "retina", "transparent", "canvas"],
      },
    ],
  },
  {
    group: "Files & Media",
    items: [
      {
        href: "/exif",
        label: "EXIF Viewer",
        description: "View photo metadata — camera settings, GPS, dates",
        keywords: ["exif", "metadata", "photo", "image", "camera", "gps", "location", "iphone", "jpeg", "raw", "tiff", "heic", "iptc", "xmp", "focal length", "aperture", "iso", "shutter"],
      },
      {
        href: "/zip",
        label: "ZIP Inspector",
        description: "List and extract files from ZIP archives",
        keywords: ["zip", "archive", "extract", "unzip", "inspect", "list", "files", "compress", "decompress", "fflate", "tar", "contents", "size"],
      },
      {
        href: "/pdf",
        label: "PDF Tools",
        description: "Inspect, merge & split PDF files",
        keywords: ["pdf", "inspect", "merge", "join", "split", "combine", "extract", "metadata", "pages", "author", "title", "creator", "document", "page size", "a4", "pdf-lib", "joiner", "splitter", "inspector"],
      },
      {
        href: "/video-thumb",
        label: "Video Thumbnail",
        description: "Extract frames from video files as PNG images",
        keywords: ["video", "thumbnail", "frame", "extract", "screenshot", "capture", "mp4", "webm", "mov", "avi", "mkv", "png", "timestamp", "seek"],
      },
    ],
  },
  {
    group: "Database",
    items: [
      {
        href: "/sqlite",
        label: "SQLite Playground",
        description: "Run SQL queries in-browser with a WASM SQLite database",
        keywords: ["sqlite", "sql", "database", "query", "playground", "wasm", "in-memory", "select", "insert", "create", "table", "schema", "db", "browser", "sql.js"],
      },
    ],
  },
  {
    group: "Network",
    items: [
      {
        href: "/ip",
        label: "IP Info",
        description: "Look up IP geolocation, ISP, ASN and timezone",
        keywords: ["ip", "ip address", "geolocation", "location", "isp", "asn", "autonomous system", "timezone", "country", "city", "lookup", "myip", "whatismyip"],
      },
      {
        href: "/dns",
        label: "DNS Lookup",
        description: "Query DNS records via Cloudflare DNS-over-HTTPS",
        keywords: ["dns", "lookup", "a", "aaaa", "mx", "cname", "txt", "ns", "soa", "ptr", "caa", "record", "domain", "nameserver", "doh", "cloudflare", "resolve", "hostname"],
      },
    ],
  },
];

export const ALL_TOOLS: ToolItem[] = TOOL_GROUPS.flatMap((g) => g.items);

/** Score a tool against a query. Higher = better match. 0 = no match. */
export function scoreTool(tool: ToolItem, raw: string): number {
  const q = raw.toLowerCase().trim();
  if (!q) return 0;

  const label = tool.label.toLowerCase();
  const desc = tool.description.toLowerCase();

  if (label === q) return 100;
  if (label.startsWith(q)) return 90;
  if (label.includes(q)) return 80;

  // label word boundary: any word in the label starts with query
  if (label.split(/\s+/).some((w) => w.startsWith(q))) return 75;

  // exact keyword match
  if (tool.keywords.some((k) => k === q)) return 70;
  // keyword starts with query
  if (tool.keywords.some((k) => k.startsWith(q))) return 60;
  // keyword contains query
  if (tool.keywords.some((k) => k.includes(q))) return 50;
  // keyword word boundary
  if (tool.keywords.some((k) => k.split(/\s+/).some((w) => w.startsWith(q)))) return 45;

  // description contains query
  if (desc.includes(q)) return 30;

  // multi-word: every word in the query appears somewhere
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const allText = `${label} ${tool.keywords.join(" ")} ${desc}`;
    if (words.every((w) => allText.includes(w))) return 20;
  }

  return 0;
}
