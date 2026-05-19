# Dev Tools

A collection of 54 browser-based developer tools. Everything runs locally — no data leaves your tab.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4

---

## Getting started

```bash
npm install
npm run dev
```

---

## Tools

### Core
| Tool | Route | Description |
|------|-------|-------------|
| File Converter | `/files` | Convert video, audio & images via FFmpeg.wasm |
| JSON Tools | `/json` | Format, validate, minify & diff JSON |
| QR Code Generator | `/qr` | Generate QR codes for URLs, text & more |
| Image Resize | `/resize` | Resize images locally |
| Chmod Calculator | `/chmod` | Build Unix file permissions visually |
| Barcode Generator | `/barcode` | Generate 1D & 2D barcodes (Code 128, EAN, QR, Data Matrix) |

### Encoding
| Tool | Route | Description |
|------|-------|-------------|
| Base64 | `/base64` | Encode & decode Base64 strings and files |
| HTML Entities | `/html` | Encode & decode HTML entities |
| Hash Generator | `/hash` | SHA-1, SHA-256, SHA-384, SHA-512 hashes |

### Auth & Tokens
| Tool | Route | Description |
|------|-------|-------------|
| JWT Decoder | `/jwt` | Decode & inspect JWT tokens |
| JWT Builder | `/jwt-builder` | Sign & create JWT tokens |
| Password Generator | `/password` | Generate secure random passwords |
| UUID / ULID | `/uuid` | Generate UUID v4 and ULID identifiers |
| HMAC Generator | `/hmac` | Generate HMAC signatures (SHA-256/384/512) |
| AES Encrypt/Decrypt | `/aes` | AES-GCM 256-bit encryption with password |
| RSA Key Pair | `/rsa` | Generate RSA key pairs (2048 / 4096-bit) |

### Data
| Tool | Route | Description |
|------|-------|-------------|
| JSON → TypeScript | `/json-to-ts` | Generate TypeScript interfaces from JSON |
| YAML ↔ JSON | `/yaml` | Convert between YAML and JSON |
| CSV ↔ JSON | `/csv` | Convert between CSV and JSON |
| URL Parser | `/url` | Parse, encode & decode URLs |
| Timestamp | `/timestamp` | Convert Unix timestamps to dates and back |
| Base Converter | `/base` | Convert between decimal, hex, binary & octal |
| Color Converter | `/color` | Convert between HEX, RGB, HSL & more |
| Size Converter | `/size` | Convert px, rem, em, vw, pt, cm and more |
| Number Formatter | `/number` | Format numbers with locale, currency & notation |
| XML Formatter | `/xml` | Format, minify & validate XML |
| SQL Formatter | `/sql` | Format & minify SQL queries |

### Text & Code
| Tool | Route | Description |
|------|-------|-------------|
| Regex Tester | `/regex` | Test regular expressions with live highlighting |
| Text Diff | `/diff` | Compare two texts and highlight differences |
| Cron Parser | `/cron` | Parse & explain cron expressions |
| String Case | `/case` | Convert between camelCase, snake_case, PascalCase & more |
| Markdown Preview | `/markdown` | Live Markdown preview |
| Lorem Ipsum | `/lorem` | Generate placeholder text |
| Markdown → PDF | `/md-pdf` | Convert Markdown to a downloadable PDF |
| SVG → PNG | `/svg` | Convert SVG to PNG |
| Text Statistics | `/text-stats` | Word count, reading time & character breakdown |
| Slug Generator | `/slug` | Convert text to a URL-friendly slug |

### Files & Media
| Tool | Route | Description |
|------|-------|-------------|
| EXIF Viewer | `/exif` | View photo metadata — camera settings, GPS, dates |
| ZIP Inspector | `/zip` | List and extract files from ZIP archives |
| PDF Tools | `/pdf` | Inspect, merge & split PDF files |
| Video Thumbnail | `/video-thumb` | Extract frames from video files as PNG |

### Database
| Tool | Route | Description |
|------|-------|-------------|
| SQLite Playground | `/sqlite` | Run SQL queries in-browser via WASM SQLite |

### Network
| Tool | Route | Description |
|------|-------|-------------|
| HTTP Client | `/http` | Send HTTP requests and inspect responses |
| IP Info | `/ip` | Look up IP geolocation, ISP & ASN |
| DNS Lookup | `/dns` | Query DNS records via Cloudflare DoH |
| Subnet Calculator | `/subnet` | CIDR subnet math — mask, hosts, broadcast |
| cURL → Fetch | `/curl` | Convert curl commands to JavaScript fetch() |

---

## Project structure

```
app/                    # Next.js routes (one directory per tool)
src/
  components/           # Tool UI components
  hooks/                # useFFmpeg, useConverter, useFileDrop
  lib/
    tools.ts            # Tool registry (labels, descriptions, keywords)
  types/
  utils/
public/
next.config.ts
```

---

## Key dependencies

| Package | Purpose |
|---------|---------|
| `@ffmpeg/ffmpeg` | Video & audio conversion via WASM |
| `pdf-lib` | PDF merge, split & inspection |
| `sql.js` | SQLite in the browser via WASM |
| `js-yaml` | YAML parsing |
| `marked` | Markdown rendering |
| `jspdf` | Markdown → PDF export |
| `diff` | Text diffing |
| `fflate` | ZIP inspection |
| `exifr` | EXIF metadata extraction |
| `bwip-js` | Barcode generation |
| `qrcode` | QR code generation |
| `ulid` | ULID generation |

All crypto tools (HMAC, AES, RSA, Hash) use the browser's native `crypto.subtle` API — no external crypto library required.

---

## Notes

- FFmpeg.wasm requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers (configured in `next.config.ts`).
- The tool registry (`src/lib/tools.ts`) powers both the homepage grid and the command-palette search.
