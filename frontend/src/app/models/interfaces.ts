export interface IngestPDFRequest {
  pdf_path: string;
  source_id?: string;
}

export interface IngestPDFResponse {
  message: string;
  pdf_path: string;
  source_id: string;
}

export interface QueryPDFRequest {
  question: string;
  top_k: number;
}

export interface QueryPDFResponse {
  event_id: string;
  message: string;
  question: string;
  top_k: number;
}

export interface InngestRun {
  status: string;
  output?: QueryResult;
}

export interface InngestRunsResponse {
  data: InngestRun[];
}

export interface QueryResult {
  answer: string;
  sources: string[];
  num_contexts?: number;
}

export interface UploadEvent {
  eventId: string;
}
