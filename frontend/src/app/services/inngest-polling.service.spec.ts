import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { InngestPollingService } from './inngest-polling.service';

describe('InngestPollingService', () => {
  let service: InngestPollingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(InngestPollingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
