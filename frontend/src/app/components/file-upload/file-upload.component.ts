import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RagService } from '../../services/rag.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent {
  selectedFile = signal<File | null>(null);
  isUploading = signal(false);
  uploadMessage = signal<string>('');
  uploadError = signal<string>('');

  constructor(private ragService: RagService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile.set(file);
        this.uploadError.set('');
        this.uploadMessage.set('');
      } else {
        this.uploadError.set('Please select a PDF file');
        this.selectedFile.set(null);
      }
    }
  }

  uploadPDF(): void {
    const file = this.selectedFile();
    if (!file) {
      this.uploadError.set('Please select a file first');
      return;
    }

    this.isUploading.set(true);
    this.uploadError.set('');
    this.uploadMessage.set('');

    this.ragService.uploadPDF(file).subscribe({
      next: (response) => {
        this.isUploading.set(false);
        this.uploadMessage.set(`Triggered ingestion for: ${file.name}`);
        this.selectedFile.set(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      },
      error: (error) => {
        this.isUploading.set(false);
        this.uploadError.set(`Upload failed: ${error.message || 'Unknown error'}`);
      }
    });
  }
}
