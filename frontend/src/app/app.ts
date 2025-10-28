import { Component, signal } from '@angular/core';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { QueryFormComponent } from './components/query-form/query-form.component';
import { ResultsDisplayComponent } from './components/results-display/results-display.component';
import { QueryResult } from './models/interfaces';

@Component({
  selector: 'app-root',
  imports: [FileUploadComponent, QueryFormComponent, ResultsDisplayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  queryResult = signal<QueryResult | null>(null);

  onResultReady(result: QueryResult): void {
    this.queryResult.set(result);
  }
}
