"use client";

import { useCallback, useRef, useState } from "react";
import exifr from "exifr";

interface ImageInfo {
  file: File;
  width: number;
  height: number;
}

interface ExifEntry {
  key: string;
  value: string;
  group: string;
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1_048_576).toFixed(2)} MB`;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

const GPS_KEYS = new Set([
  "GPSLatitude", "GPSLongitude", "GPSAltitude", "GPSLatitudeRef", "GPSLongitudeRef",
  "GPSAltitudeRef", "GPSSpeed", "GPSSpeedRef", "GPSImgDirection", "GPSImgDirectionRef",
  "GPSDateStamp", "GPSTimeStamp", "GPSProcessingMethod", "latitude", "longitude",
]);

const CAMERA_KEYS = new Set([
  "Make", "Model", "LensMake", "LensModel", "LensInfo", "FocalLength",
  "FocalLengthIn35mmFormat", "FNumber", "ExposureTime", "ISO", "ISOSpeedRatings",
  "ShutterSpeedValue", "ApertureValue", "ExposureBiasValue", "MaxApertureValue",
  "MeteringMode", "Flash", "ExposureMode", "ExposureProgram", "WhiteBalance",
  "DigitalZoomRatio", "SceneCaptureType", "GainControl", "Contrast", "Saturation",
  "Sharpness", "SubjectDistance",
]);

const IMAGE_KEYS = new Set([
  "ImageWidth", "ImageHeight", "BitsPerSample", "Compression", "PhotometricInterpretation",
  "Orientation", "SamplesPerPixel", "PlanarConfiguration", "YCbCrSubSampling",
  "YCbCrPositioning", "XResolution", "YResolution", "ResolutionUnit", "ColorSpace",
  "ExifImageWidth", "ExifImageHeight", "PixelXDimension", "PixelYDimension",
  "ComponentsConfiguration", "CompressedBitsPerPixel",
]);

const DATE_KEYS = new Set([
  "DateTime", "DateTimeOriginal", "DateTimeDigitized", "CreateDate", "ModifyDate",
  "SubSecTime", "SubSecTimeOriginal", "SubSecTimeDigitized", "OffsetTime",
  "OffsetTimeOriginal", "OffsetTimeDigitized",
]);

function getGroup(key: string): string {
  if (GPS_KEYS.has(key)) return "GPS";
  if (CAMERA_KEYS.has(key)) return "Camera";
  if (IMAGE_KEYS.has(key)) return "Image";
  if (DATE_KEYS.has(key)) return "Date & Time";
  return "Other";
}

const GROUP_ORDER = ["GPS", "Camera", "Image", "Date & Time", "Other"];

export function ExifViewer() {
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [entries, setEntries] = useState<ExifEntry[]>([]);
  const [error, setError] = useState("");
  const [dropHover, setDropHover] = useState(false);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [noData, setNoData] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/") && !file.name.match(/\.(heic|heif|tiff?|arw|cr2|nef|orf|raf|rw2|dng)$/i)) {
      setError("Please select an image file.");
      return;
    }

    setError("");
    setNoData(false);
    setEntries([]);
    setImageInfo(null);
    setSearch("");

    // Get image dimensions using browser Image element
    const url = URL.createObjectURL(file);
    const img = new Image();
    const dims = await new Promise<{ width: number; height: number }>((resolve) => {
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = url;
    });
    URL.revokeObjectURL(url);

    setImageInfo({ file, width: dims.width, height: dims.height });

    try {
      const data = await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: true,
        iptc: true,
        icc: false,
        xmp: false,
      });

      if (!data || Object.keys(data).length === 0) {
        setNoData(true);
        return;
      }

      const parsed: ExifEntry[] = Object.entries(data).map(([key, value]) => ({
        key,
        value: formatValue(value),
        group: getGroup(key),
      }));

      // Sort by group order then alphabetically by key
      parsed.sort((a, b) => {
        const gi = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
        if (gi !== 0) return gi;
        return a.key.localeCompare(b.key);
      });

      setEntries(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read EXIF data.");
    }
  }, []);

  function handleFiles(files: FileList | null) {
    if (files?.[0]) loadFile(files[0]);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropHover(false);
    handleFiles(e.dataTransfer.files);
  }

  function downloadJson() {
    const obj: Record<string, string> = {};
    for (const { key, value } of entries) {
      obj[key] = value;
    }
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${imageInfo?.file.name ?? "exif"}-metadata.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const gpsEntry = entries.find((e) => e.key === "latitude" || e.key === "GPSLatitude");
  const gpsLonEntry = entries.find((e) => e.key === "longitude" || e.key === "GPSLongitude");
  const gpsCoords =
    gpsEntry && gpsLonEntry
      ? `${gpsEntry.value}, ${gpsLonEntry.value}`
      : null;

  function copyGps() {
    if (!gpsCoords) return;
    navigator.clipboard.writeText(gpsCoords).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  const filteredEntries = search.trim()
    ? entries.filter(
        (e) =>
          e.key.toLowerCase().includes(search.toLowerCase()) ||
          e.value.toLowerCase().includes(search.toLowerCase()),
      )
    : entries;

  const hasFile = imageInfo !== null;

  const dropCls = `flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors cursor-pointer select-none py-12 ${
    dropHover
      ? "border-amber-400/60 bg-amber-400/5"
      : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
  }`;

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">EXIF Viewer</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Inspect photo metadata and EXIF data — nothing is uploaded.
        </p>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif,.tiff,.tif,.arw,.cr2,.nef,.orf,.raf,.rw2,.dng"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {!hasFile && (
          <div
            className={dropCls}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDropHover(true);
            }}
            onDragLeave={() => setDropHover(false)}
            onDrop={onDrop}
          >
            <svg
              className="h-10 w-10 text-zinc-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <p className="text-sm text-zinc-400">
              Drop an image here or <span className="text-amber-400">browse</span>
            </p>
            <p className="text-xs text-zinc-600">JPEG, PNG, TIFF, HEIC, RAW, and more</p>
          </div>
        )}

        {hasFile && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200">{imageInfo.file.name}</p>
              <p className="text-xs text-zinc-500">
                {fmtBytes(imageInfo.file.size)}
                {imageInfo.width > 0 && ` · ${imageInfo.width}×${imageInfo.height} px`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="shrink-0 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Change
            </button>
          </div>
        )}

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        {hasFile && noData && !error && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-6 text-center">
            <p className="text-sm text-zinc-400">No EXIF metadata found in this image.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Screenshots and exported images often have metadata stripped.
            </p>
          </div>
        )}

        {gpsCoords && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/50 bg-amber-400/10 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-amber-400">GPS Coordinates</p>
              <p className="mt-0.5 font-mono text-sm text-zinc-100">{gpsCoords}</p>
            </div>
            <button
              type="button"
              onClick={copyGps}
              className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {entries.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <input
                type="search"
                placeholder="Search tags…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
              />
              <button
                type="button"
                onClick={downloadJson}
                className="shrink-0 rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Download JSON
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-800">
              <div className="max-h-[480px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-zinc-900">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                        Tag
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                        Value
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                        Group
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-xs text-zinc-600">
                          No matching tags.
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map((entry) => (
                        <tr
                          key={entry.key}
                          className="transition-colors hover:bg-zinc-800/30"
                        >
                          <td className="px-4 py-2.5 text-xs text-zinc-400">{entry.key}</td>
                          <td className="max-w-xs px-4 py-2.5 font-mono text-xs text-zinc-100">
                            <span className="block truncate" title={entry.value}>
                              {entry.value}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                              {entry.group}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-zinc-600">
              {filteredEntries.length} of {entries.length} tags
            </p>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
