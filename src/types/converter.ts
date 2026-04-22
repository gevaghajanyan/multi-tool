export type ConverterType = "video" | "audio" | "image";

export type JobStatus =
  | "queued"
  | "converting"
  | "done"
  | "error";

export interface ConvertJob {
  id: string;
  file: File;
  inputFormat: string;
  status: JobStatus;
  progress: number;
  logLines: string[];
  outputUrl?: string;
  outputSize?: number;
  outputFormat?: string;
  error?: string;
}
