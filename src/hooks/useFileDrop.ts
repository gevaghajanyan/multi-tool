"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useFileDrop(onFiles: (files: File[]) => void) {
  const [dragOver, setDragOver] = useState(false);
  const depth = useRef(0);
  const onFilesRef = useRef(onFiles);

  useEffect(() => {
    onFilesRef.current = onFiles;
  }, [onFiles]);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    depth.current += 1;
    setDragOver(true);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    depth.current = 0;
    setDragOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      onFilesRef.current(Array.from(files));
    }
  }, []);

  return {
    dragOver,
    dropHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
}
