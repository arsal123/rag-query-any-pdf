# RAG PDF Query System - AI Agent Instructions

An event-driven RAG system for querying PDF documents using FastAPI, Inngest, Qdrant vector database, and Angular 20.

## Architecture Overview

This is a **full-stack event-driven application** with 4 concurrent services that must run together:

1. **FastAPI Backend** (port 8000) - `main.py` defines REST endpoints and Inngest function handlers
2. **Inngest Dev Server** (port 8288) - Orchestrates async workflows and provides status polling endpoints
3. **Qdrant Vector DB** (port 6333) - Docker container for vector storage
4. **Angular Frontend** (port 4200) - User interface in `frontend/` directory

### Critical Data Flow Pattern

**PDF Ingestion (async):**
```
Upload → FastAPI /rag/ingest-pdf → Inngest rag/ingest_pdf event → 
  Step 1: load_and_chunk_pdf() → 
  Step 2: embed_texts() → upsert to Qdrant
```

**Query (async with polling):**
```
Question → FastAPI /rag/query-pdf → Returns event_id immediately →
Inngest rag/query_pdf_ai event → 
  Step 1: Embed question + vector search Qdrant → 
  Step 2: GPT-4o-mini generates answer →
Frontend polls Inngest API at /v1/events/{eventId}/runs until complete
```

## Development Commands

**Start all services (4 separate terminals):**
```bash
# Terminal 1: Qdrant
docker run -d --name qdrant -p 6333:6333 -v "$(pwd)/qdrant_storage:/qdrant/storage" qdrant/qdrant

# Terminal 2: FastAPI
uvicorn main:app --reload

# Terminal 3: Inngest (MUST point to FastAPI)
npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest

# Terminal 4: Angular
cd frontend && npm install && npm start
```

**Testing:**
```bash
cd frontend
npm test              # Jest tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage
```

## Backend Patterns (Python)

### Inngest Function Structure
All Inngest functions in `main.py` follow this pattern:
- Decorated with `@inngest_client.create_function()`
- Event-triggered with `TriggerEvent(event="rag/...")`
- Use `ctx.step.run()` for each workflow step with explicit `output_type` (Pydantic models from `custom_types.py`)
- Steps are idempotent and retriable

**Rate limiting example from `rag_ingest_pdf`:**
```python
throttle=inngest.Throttle(limit=2, period=datetime.timedelta(minutes=1))
rate_limit=inngest.RateLimit(limit=1, period=datetime.timedelta(hours=4), key="event.data.source_id")
```

### Vector Database (`vector_db.py`)
- `QdrantStorage` class wraps Qdrant client
- Auto-creates collection if not exists
- Embedding dimension: **3072** (from OpenAI `text-embedding-3-large`)
- Search uses **cosine distance**
- UUID generation for chunk IDs: `uuid.uuid5(uuid.NAMESPACE_URL, f"{source_id}:{i}")`

### PDF Processing (`data_loader.py`)
- `SentenceSplitter` chunking: **chunk_size=1000, chunk_overlap=200**
- Always use LlamaIndex `PDFReader` for PDF parsing
- Batch embedding with OpenAI client directly (not through Inngest for performance)

### Custom Types (`custom_types.py`)
- All Pydantic models for type safety across Inngest steps
- Use `inngest.PydanticSerializer()` for event serialization
- Models: `RAGChunkAndSrc`, `RAGUpsertResult`, `RAGSearchResult`, `RAQQueryResult`

## Frontend Patterns (Angular 20)

### Angular Modern Patterns
- **Standalone components only** - no NgModules
- **Signal-based state**: Use `signal()` for reactive state, not RxJS subjects
- **Constructor injection** - still preferred over `inject()` function
- **Jest testing** (not Karma) - see `jest.config.js`

### Event-Driven Async Pattern
Key integration point: `InngestPollingService` handles the async workflow polling:
```typescript
// 1. Submit query, get event_id
this.ragService.queryPDF(question).subscribe(response => {
  // 2. Poll until complete
  this.inngestPolling.waitForRunOutput(response.event_id).subscribe(result => {
    // 3. Display result
  });
});
```

**Polling configuration:**
- Interval: 5000ms (5 seconds)
- Timeout: 120000ms (2 minutes)
- Direct HTTP calls to `http://127.0.0.1:8288/v1/events/{eventId}/runs` (NOT proxied)

### Component Communication
- **App.ts** holds global `queryResult` signal
- Child components emit events upward: `resultReady = output<QueryResult>()`
- Parent updates signals: `onResultReady(result: QueryResult) { this.queryResult.set(result); }`

### API Proxy Configuration
`proxy.conf.json` routes `/rag` requests to `localhost:8000` - frontend makes requests to relative paths like `/rag/query-pdf`

## Project-Specific Conventions

### Environment Variables
Required in `.env` at project root:
```bash
OPENAI_API_KEY=sk-...
MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
```

### File Storage
- Uploaded PDFs stored in `uploads/` directory
- Qdrant data persists in `qdrant_storage/` (Docker volume mount)
- Frontend passes file paths to backend (assumes shared filesystem for dev)

### Error Handling
- **Backend**: Inngest automatically retries failed steps
- **Frontend**: Observable error handling in services, signal-based error display in components
- **Polling timeouts**: 120s limit enforced in `InngestPollingService`

### Testing Practices
- **Frontend**: Test standalone components with `provideHttpClient()` and `provideHttpClientTesting()`
- **HTTP mocking**: Use Angular's built-in `HttpTestingController`
- **Signal testing**: Access signal values with `component.signal()`

## Common Workflows

### Adding New Inngest Function
1. Define Pydantic models in `custom_types.py` for step inputs/outputs
2. Create function with `@inngest_client.create_function()` decorator
3. Add to `inngest.fast_api.serve()` array at bottom of `main.py`
4. Define REST endpoint to trigger event with `inngest_client.send()`

### Adding New Vector Collection
Modify `QdrantStorage.__init__()` to accept collection name parameter - default is `"docs"`

### Debugging Async Workflows
1. Check Inngest dashboard at `http://localhost:8288` for function runs
2. View Qdrant collections at `http://localhost:6333/dashboard`
3. Backend logs show step outputs: `ctx.logger.info(f"Upsert result: {ingested}")`
