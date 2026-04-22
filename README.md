# File Converter App — Claude Code Prompt

## Stack
- React 18 + TypeScript (strict mode)
- Tailwind CSS v4
- FFmpeg.wasm (`@ffmpeg/ffmpeg` + `@ffmpeg/util`) for video/audio
- Canvas API for image conversion
- Vite as bundler

---

## Features

### 3 Converter Types
| Type  | Input formats | Output formats |
|-------|--------------|----------------|
| Video | MP4, WebM, MKV, MOV, AVI, FLV | MP4, WebM, MKV, MOV, AVI |
| Audio | MP3, WAV, OGG, FLAC, AAC, M4A | MP3, WAV, OGG, FLAC, AAC |
| Image | JPG, PNG, WebP, GIF, BMP, TIFF | JPG, PNG, WebP, GIF, BMP |

### UX Flow
1. Tab switcher — Video / Audio / Image
2. Drag-and-drop zone + click-to-browse
3. Selected file shows name, size, format badge
4. Output format grid — disable button matching input format
5. Convert button — disabled until file + format selected
6. Progress bar with percentage parsed from FFmpeg logs
7. Log panel showing FFmpeg stderr in real time
8. On complete — download button with correct output filename + reset

---

## Types (`src/types/converter.ts`)

```ts
type ConverterType = 'video' | 'audio' | 'image'

interface ConvertJob {
  id: string
  file: File
  inputFormat: string
  outputFormat: string
  type: ConverterType
  status: 'idle' | 'loading' | 'converting' | 'done' | 'error'
  progress: number
  logLines: string[]
  outputUrl?: string
  outputSize?: number
  error?: string
}
```

---

## Hooks

### `useFFmpeg.ts`
- Singleton FFmpeg instance — load once on app mount, never re-initialize
- Load using `toBlobURL` from `@ffmpeg/util` pointing to CDN assets
- Expose `loaded: boolean` and `ffmpeg` ref
- Show global loading state until WASM is ready

### `useConverter.ts`
- Accepts `type: ConverterType`
- Manages full `ConvertJob` state
- Exposes `convert(file, outputFormat)`, `reset()`
- For video/audio: uses FFmpeg (`writeFile` → `exec` → `readFile`)
- For image: uses Canvas API (`createImageBitmap` → draw → `toBlob`)

### `useFileDrop.ts`
- Handles `dragenter`, `dragover`, `dragleave`, `drop` events
- Returns `dragOver: boolean` and calls `onFile(file)` on valid drop

---

## Components

```
src/components/
  ConverterTabs.tsx   — tab navigation (Video / Audio / Image)
  DropZone.tsx        — upload area, accepts type + dragOver props
  FileInfo.tsx        — file name, size, format badge, clear button
  FormatGrid.tsx      — clickable output format buttons
  ConvertButton.tsx   — main CTA, loading + disabled states
  ProgressPanel.tsx   — progress bar + scrollable log output
  ResultPanel.tsx     — download button + reset
```

---

## Utilities

### `src/utils/formats.ts`
```ts
export const FORMATS: Record<ConverterType, { input: string[]; output: string[] }> = {
  video: { input: ['mp4','webm','mkv','mov','avi','flv'], output: ['mp4','webm','mkv','mov','avi'] },
  audio: { input: ['mp3','wav','ogg','flac','aac','m4a'], output: ['mp3','wav','ogg','flac','aac'] },
  image: { input: ['jpg','png','webp','gif','bmp','tiff'], output: ['jpg','png','webp','gif','bmp'] },
}
```

### `src/utils/parseProgress.ts`
- Parse FFmpeg log lines matching `time=HH:MM:SS.ms`
- Compare against total duration to produce a 0–100 number
- Export `parseProgress(log: string, duration: number): number | null`

### `src/utils/formatBytes.ts`
- Export `formatBytes(bytes: number): string` → e.g. `"4.2 MB"`

---

## File Structure

```
src/
  components/
    ConverterTabs.tsx
    DropZone.tsx
    FileInfo.tsx
    FormatGrid.tsx
    ConvertButton.tsx
    ProgressPanel.tsx
    ResultPanel.tsx
  hooks/
    useFFmpeg.ts
    useConverter.ts
    useFileDrop.ts
  types/
    converter.ts
  utils/
    formats.ts
    parseProgress.ts
    formatBytes.ts
  App.tsx
  main.tsx
vite.config.ts
```

---

## FFmpeg Integration

```ts
// Load
const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
await ffmpeg.load({
  coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
  wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
})

// Convert
await ffmpeg.writeFile(`input.${inputFmt}`, await fetchFile(file))
await ffmpeg.exec(['-i', `input.${inputFmt}`, `output.${outputFmt}`])
const data = await ffmpeg.readFile(`output.${outputFmt}`)
const url = URL.createObjectURL(new Blob([data.buffer]))

// Progress listener
ffmpeg.on('log', ({ message }) => {
  appendLog(message)
  const progress = parseProgress(message, duration)
  if (progress !== null) setProgress(progress)
})
```

---

## Image Conversion (Canvas)

```ts
const bitmap = await createImageBitmap(file)
const canvas = document.createElement('canvas')
canvas.width = bitmap.width
canvas.height = bitmap.height
canvas.getContext('2d')!.drawImage(bitmap, 0, 0)

const mimeMap: Record<string, string> = {
  jpg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp',
}
canvas.toBlob(blob => {
  const url = URL.createObjectURL(blob!)
  // set as output
}, mimeMap[outputFormat], 0.92)
```

---

## Vite Config (`vite.config.ts`)

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
```

> **Required:** FFmpeg.wasm uses `SharedArrayBuffer` which requires `crossOriginIsolated`.
> These headers must also be set in production (Vercel → `vercel.json`, Netlify → `_headers`).

---

## Tailwind Notes
- Base: `bg-zinc-950` dark theme
- Accent: `amber-400` / `amber-500` for active states, progress, buttons
- Borders: `border-zinc-800` default, `border-amber-400` on focus/active
- No external component libraries — Tailwind utilities only
- All hover/focus states use `transition-colors duration-150`

---

## Constraints & Reminders
- FFmpeg singleton — load once in `useFFmpeg`, share via context or module-level ref
- Revoke all `URL.createObjectURL` blobs on component unmount
- Clean up FFmpeg virtual FS files after each conversion (`ffmpeg.deleteFile(...)`)
- Disable Convert button while any conversion is in progress
- Derive input format from `file.name.split('.').pop()` normalized to lowercase