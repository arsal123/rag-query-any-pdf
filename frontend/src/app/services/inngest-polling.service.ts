import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { switchMap, map, takeWhile, timeout, catchError, filter, take } from 'rxjs/operators';
import { InngestRunsResponse, QueryResult } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class InngestPollingService {
  private inngestApiBase = 'http://127.0.0.1:8288/v1';
  private pollIntervalMs = 5000;
  private timeoutMs = 120000;

  constructor(private http: HttpClient) {}

  waitForRunOutput(eventId: string): Observable<QueryResult> {
    console.log('Starting to poll for event:', eventId);
    const startTime = Date.now();
    
    return timer(0, this.pollIntervalMs).pipe(
      switchMap(() => this.fetchRuns(eventId)),
      map(response => {
        console.log('Poll response:', response);
        if (Date.now() - startTime > this.timeoutMs) {
          throw new Error('Timeout waiting for run output');
        }

        if (response.data && response.data.length > 0) {
          const run = response.data[0];
          const status = run.status;
          console.log('Run status:', status, 'Output:', run.output);

          if (this.isCompleted(status)) {
            if (run.output) {
              return { completed: true, output: run.output };
            }
            throw new Error('Run completed but no output received');
          }

          if (this.isFailed(status)) {
            throw new Error(`Function run ${status}`);
          }
        }

        return { completed: false, output: null };
      }),
      map(result => {
        if (!result.completed) {
          return null; // Still polling, return null
        }
        if (result.output) {
          return result.output;
        }
        throw new Error('Run completed but no output received');
      }),
      // Filter out null values (polling in progress)
      filter(result => result !== null),
      // Take only the first non-null result (the completed output)
      take(1),
      timeout(this.timeoutMs),
      catchError(error => {
        if (error.name === 'TimeoutError') {
          return throwError(() => new Error('Request timed out after 120 seconds'));
        }
        return throwError(() => error);
      })
    );
  }

  private fetchRuns(eventId: string): Observable<InngestRunsResponse> {
    const url = `${this.inngestApiBase}/events/${eventId}/runs`;
    return this.http.get<InngestRunsResponse>(url);
  }

  private isCompleted(status: string): boolean {
    const completedStatuses = ['Completed', 'Succeeded', 'Success', 'Finished'];
    return completedStatuses.includes(status);
  }

  private isFailed(status: string): boolean {
    const failedStatuses = ['Failed', 'Cancelled'];
    return failedStatuses.includes(status);
  }
}
