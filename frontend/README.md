# RAG PDF Query - Angular Frontend

An Angular 20 frontend application for uploading and querying PDFs using RAG (Retrieval-Augmented Generation) technology.

## Features

- 📤 **PDF Upload**: Upload PDF files for ingestion into the RAG system
- 🔍 **Smart Querying**: Ask questions about your uploaded PDFs with configurable retrieval parameters
- 🤖 **AI-Powered Answers**: Get AI-generated responses based on document content
- 📚 **Source References**: View sources used to generate each answer
- ⚡ **Real-time Processing**: Live status updates during upload and query processing
- 🎨 **Modern UI**: Built with Tailwind CSS for a clean, professional interface

## Technology Stack

- **Angular 20** (standalone components)
- **TypeScript**
- **Tailwind CSS** with SCSS
- **Signal-based Forms** (reactive state management)
- **Jest** for testing
- **RxJS** for reactive programming

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Angular CLI**: v20.3.4

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Backend Setup

This frontend requires the FastAPI backend to be running. Ensure the following services are available:

1. **FastAPI Backend**: Running on `http://localhost:8000`
   - Provides `/rag/ingest-pdf` and `/rag/query-pdf` endpoints

2. **Inngest Dev Server**: Running on `http://127.0.0.1:8288`
   - Handles event-driven workflows for PDF processing

To start the backend services:

```bash
# In the root directory of the project
python -m uvicorn main:app --reload

# In a separate terminal, start Inngest dev server
npx inngest-cli dev
```

## Development Server

Start the development server with proxy configuration:

```bash
npm start
```

or

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you make changes to the source files.

### Proxy Configuration

The development server is configured to proxy API requests to avoid CORS issues:
- `/rag/*` → `http://localhost:8000`

This configuration is defined in `proxy.conf.json`.

## Project Structure

```
src/app/
├── components/
│   ├── file-upload/          # PDF file upload component
│   ├── query-form/            # Question input and submission form
│   └── results-display/       # Display AI answers and sources
├── services/
│   ├── rag.service.ts         # FastAPI communication service
│   └── inngest-polling.service.ts  # Inngest polling service
├── models/
│   └── interfaces.ts          # TypeScript interfaces
└── app.ts                     # Main application component
```

## Available Scripts

### Development
```bash
npm start              # Start dev server with proxy
ng serve               # Alternative: Start dev server
```

### Building
```bash
npm run build          # Build for production
ng build               # Alternative: Build for production
```

### Testing
```bash
npm test               # Run Jest tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```

### Linting
```bash
ng lint                # Run linting (if configured)
```

## Usage

### 1. Upload a PDF

1. Click on the file input or drag a PDF file
2. Select a PDF file from your computer
3. Click "Upload and Ingest" button
4. Wait for the success message confirming ingestion

### 2. Query Your PDFs

1. Enter your question in the text input
2. Optionally adjust the "top_k" parameter (number of document chunks to retrieve)
3. Click the "Ask" button
4. Wait for the AI to generate an answer based on your documents

### 3. View Results

- The answer will be displayed below the query form
- Source references are listed to show which documents were used

## API Endpoints

The frontend communicates with these backend endpoints:

### POST `/rag/ingest-pdf`
Triggers PDF ingestion into the vector database.

**Request Body:**
```json
{
  "pdf_path": "path/to/file.pdf",
  "source_id": "unique_identifier"
}
```

### POST `/rag/query-pdf`
Submits a question to query the indexed PDFs.

**Request Body:**
```json
{
  "question": "Your question here?",
  "top_k": 5
}
```

## Configuration

### API Base URLs

The application uses the following API endpoints (configured via proxy):

- **FastAPI Backend**: `/rag` → `http://localhost:8000`
- **Inngest API**: `http://127.0.0.1:8288/v1`

To change these URLs, edit:
- `proxy.conf.json` for the FastAPI proxy
- `src/app/services/inngest-polling.service.ts` for Inngest API base URL

## Styling

This project uses **Tailwind CSS** for styling:

- Global styles are in `src/styles.scss`
- Tailwind configuration is in `tailwind.config.js`
- Component-specific styles use Tailwind utility classes

To customize the theme, edit `tailwind.config.js`.

## Testing

Tests are written using Jest. Run tests with:

```bash
npm test
```

Test files are located next to their corresponding source files with a `.spec.ts` extension.

### Test Coverage

Generate a coverage report:

```bash
npm run test:coverage
```

Coverage reports will be generated in the `coverage/` directory.

## Building for Production

Build the project for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Production Deployment

When deploying to production:

1. Update the proxy configuration or API base URLs to point to your production backend
2. Build the application with production configuration
3. Serve the `dist/` directory using a web server (e.g., Nginx, Apache)

## Troubleshooting

### CORS Issues

If you encounter CORS errors:
- Ensure the proxy configuration in `proxy.conf.json` is correct
- Verify the backend server is running on the correct port
- Check that `ng serve` is using the proxy configuration

### Polling Timeout

If queries timeout:
- Check that the Inngest dev server is running
- Verify the Inngest API base URL in `inngest-polling.service.ts`
- Ensure the backend is processing events correctly

### File Upload Issues

If file uploads fail:
- Verify the backend `/rag/ingest-pdf` endpoint is accessible
- Check that the `uploads/` directory exists on the backend
- Ensure PDF files are properly formatted

## Contributing

When contributing to this project:

1. Follow the existing code style and patterns
2. Use signals for reactive state management
3. Keep components focused and single-purpose
4. Write tests for new features
5. Use Tailwind CSS for styling

## License

This project is part of the RAG PDF Query system.

## Support

For issues or questions, please refer to the main project documentation or create an issue in the project repository.
