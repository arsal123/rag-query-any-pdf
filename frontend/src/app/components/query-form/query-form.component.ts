import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RagService } from '../../services/rag.service';
import { InngestPollingService } from '../../services/inngest-polling.service';
import { QueryResult } from '../../models/interfaces';

@Component({
  selector: 'app-query-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './query-form.component.html',
  styleUrl: './query-form.component.scss'
})
export class QueryFormComponent {
  question = signal('');
  topK = signal(5);
  isQuerying = signal(false);
  queryError = signal('');
  
  resultReady = output<QueryResult>();

  constructor(
    private ragService: RagService,
    private pollingService: InngestPollingService
  ) {}

  onQuestionChange(value: string): void {
    this.question.set(value);
  }

  onTopKChange(value: number): void {
    this.topK.set(value);
  }

  submitQuery(): void {
    const questionValue = this.question().trim();
    
    if (!questionValue) {
      this.queryError.set('Please enter a question');
      return;
    }

    this.isQuerying.set(true);
    this.queryError.set('');

    this.ragService.queryPDF(questionValue, this.topK()).subscribe({
      next: (response) => {
        console.log('Query response:', response);
        // Backend returns event_id in the response
        const eventId = response.event_id;
        console.log('Extracted event_id:', eventId);
        
        if (eventId && eventId.trim()) {
          this.pollForResults(eventId);
        } else {
          this.isQuerying.set(false);
          this.queryError.set('No event ID received from server');
        }
      },
      error: (error) => {
        this.isQuerying.set(false);
        this.queryError.set(`Query failed: ${error.message || 'Unknown error'}`);
      }
    });
  }

  private pollForResults(eventId: string): void {
    this.pollingService.waitForRunOutput(eventId).subscribe({
      next: (result) => {
        this.isQuerying.set(false);
        this.resultReady.emit(result);
      },
      error: (error) => {
        this.isQuerying.set(false);
        this.queryError.set(`Failed to get results: ${error.message || 'Unknown error'}`);
      }
    });
  }
}
