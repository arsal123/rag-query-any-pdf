import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IngestPDFResponse, QueryPDFRequest, QueryPDFResponse } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class RagService {
  private baseUrl = '/rag';

  constructor(private http: HttpClient) {}

  uploadPDF(file: File): Observable<any> {
    const formData = new FormData();
    
    // Save file temporarily on backend - in real scenario, backend should handle file upload
    // For now, we'll pass the file name and assume backend has access
    const request = {
      pdf_path: `uploads/${file.name}`,
      source_id: file.name
    };
    
    // First, we need to upload the file itself
    // This is a simplified version - you may need to add a separate upload endpoint
    return this.http.post<IngestPDFResponse>(`${this.baseUrl}/ingest-pdf`, request);
  }

  uploadPDFWithFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    // This endpoint should be created on the backend to handle file uploads
    return this.http.post<any>(`${this.baseUrl}/upload`, formData);
  }

  ingestPDF(pdfPath: string, sourceId?: string): Observable<IngestPDFResponse> {
    const request = {
      pdf_path: pdfPath,
      source_id: sourceId || pdfPath
    };
    
    return this.http.post<IngestPDFResponse>(`${this.baseUrl}/ingest-pdf`, request);
  }

  queryPDF(question: string, topK: number = 5): Observable<QueryPDFResponse> {
    const request: QueryPDFRequest = {
      question,
      top_k: topK
    };
    
    return this.http.post<QueryPDFResponse>(`${this.baseUrl}/query-pdf`, request);
  }
}
