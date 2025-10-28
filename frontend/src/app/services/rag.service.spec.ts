import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RagService } from './rag.service';

describe('RagService', () => {
  let service: RagService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(RagService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call ingestPDF endpoint', () => {
    const mockResponse = { message: 'success', pdf_path: 'test.pdf', source_id: 'test' };
    
    service.ingestPDF('test.pdf', 'test').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/rag/ingest-pdf');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should call queryPDF endpoint', () => {
    const mockResponse = { message: 'success', question: 'test?', top_k: 5 };
    
    service.queryPDF('test?', 5).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/rag/query-pdf');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ question: 'test?', top_k: 5 });
    req.flush(mockResponse);
  });
});
