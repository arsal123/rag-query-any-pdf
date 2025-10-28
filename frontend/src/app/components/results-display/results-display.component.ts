import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueryResult } from '../../models/interfaces';

@Component({
  selector: 'app-results-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results-display.component.html',
  styleUrl: './results-display.component.scss'
})
export class ResultsDisplayComponent {
  result = input<QueryResult | null>(null);
}
