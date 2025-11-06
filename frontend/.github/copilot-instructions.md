You are an expert in TypeScript, Angular, and scalable web application development working on a **RAG (Retrieval-Augmented Generation) PDF Query Frontend** built with Angular 20. This app allows users to upload PDFs and query their content using AI.

## Project Architecture

This is a **RAG PDF Query system** with three key integration points:
- **FastAPI Backend** (`http://localhost:8000`) - provides `/rag/ingest-pdf` and `/rag/query-pdf` endpoints
- **Inngest Dev Server** (`http://127.0.0.1:8288`) - handles asynchronous processing and job status polling
- **Angular Frontend** - this application for file upload and querying

### Core Data Flow
1. **File Upload** → `RagService.uploadPDFWithFile()` → Backend ingestion → Returns event ID
2. **Query Submission** → `RagService.queryPDF()` → Returns event ID → Poll `InngestPollingService.waitForRunOutput()`  
3. **Result Display** → Polling completes → `QueryResult` with answer and sources

### Component Communication Pattern
- **App.ts** manages global `queryResult` signal and coordinates between components
- **Components emit events upward**: `QueryFormComponent.resultReady.emit()` → `App.onResultReady()`
- **Signal-driven UI updates**: All components use signals for reactive state management

## Development Environment

### Key Commands
```bash
npm start              # Starts dev server with proxy to backend
npm run test           # Jest tests (not Karma)
npm run test:watch     # Jest in watch mode
npm run test:coverage  # Coverage reports
```

### Backend Dependencies
- Ensure FastAPI backend runs on `localhost:8000` before starting frontend
- Inngest dev server must run on `127.0.0.1:8288` for polling to work
- API proxy configured in `proxy.conf.json` routes `/rag` to backend

## Angular Patterns & Conventions

### Component Architecture
- **Standalone components only** - no NgModules (Angular 20)
- **Signal-based state**: Use `signal()` for component state, `output()` for events
- **Template-driven forms**: This project uses `FormsModule` with signals (see `QueryFormComponent`)
- **Constructor injection**: Still uses constructor DI (not `inject()` function)

### Signal Usage Examples
```typescript
// Component state
question = signal('');
isQuerying = signal(false);

// Event emission  
resultReady = output<QueryResult>();

// State updates
onQuestionChange(value: string): void {
  this.question.set(value);
}
```

### Service Patterns
- **HTTP services**: `RagService` handles all backend communication
- **Polling service**: `InngestPollingService` uses RxJS operators for async job monitoring
- **Error handling**: Services use Observable error handling, components display error signals

### Testing Setup
- **Jest** (not Karma) - configured in `jest.config.js`
- **HTTP testing**: Use `provideHttpClient()` and `provideHttpClientTesting()` 
- **Component testing**: Import standalone components directly in TestBed

### Styling
- **Tailwind CSS** with SCSS support
- **Utility-first classes**: `bg-white rounded-lg shadow-md p-6 mb-8`
- **Responsive design**: Components use Tailwind responsive utilities

## Project-Specific Patterns

### Async Processing Pattern
The app uses a **event-driven async pattern** where:
1. Actions return an `event_id` immediately  
2. `InngestPollingService` polls `GET /v1/events/{eventId}/runs` until completion
3. Results are streamed back to UI via signals

### Interface Definitions
Key types in `src/app/models/interfaces.ts`:
- `QueryResult` - Final AI response with answer and sources
- `IngestPDFRequest/Response` - File upload workflow
- `QueryPDFRequest/Response` - Question submission workflow  

### Error Handling Strategy
- **Service level**: Return Observable errors for HTTP failures
- **Component level**: Display errors in signal-driven UI elements
- **Polling errors**: Handle timeouts (120s) and failed job statuses
