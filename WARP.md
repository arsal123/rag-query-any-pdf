# RAG PDF Query System

An event-driven RAG (Retrieval-Augmented Generation) system for querying PDF documents using FastAPI, Inngest, Qdrant, and Angular.

## Commands

### Start Backend Services

```bash
# Start FastAPI server
uvicorn main:app --reload

# Start Inngest dev server (in separate terminal)
npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest

# Start Qdrant vector database (Docker)
docker run -d --name qdrant -p 6333:6333 -v "$(pwd)/qdrant_storage:/qdrant/storage" qdrant/qdrant
```

### Start Frontend

```bash
cd frontend
npm install
npm start
```

### Testing

```bash
# Frontend tests
cd frontend
npm test
npm run test:coverage
```

## Architecture Overview

This system implements an event-driven architecture orchestrated by Inngest, enabling asynchronous PDF ingestion and querying workflows.

### System Components

The application consists of three concurrent services:

1. **FastAPI Backend** (`localhost:8000`) - REST API and Inngest function definitions
2. **Inngest Dev Server** (`localhost:8288`) - Event orchestration and workflow management
3. **Angular Frontend** (`localhost:4200`) - User interface with API polling

### Event-Driven Workflow

#### PDF Ingestion Flow (`rag/ingest_pdf`)

1. User uploads PDF via Angular frontend
2. Frontend sends file path to FastAPI `/rag/ingest-pdf` endpoint
3. FastAPI triggers `rag/ingest_pdf` Inngest event
4. Inngest orchestrates two-step workflow:
   - **Step 1 (load-and-chunk)**: Load PDF and split into chunks (1000 chars, 200 overlap)
   - **Step 2 (embed-and-upsert)**: Generate OpenAI embeddings and store in Qdrant
5. Rate limiting: 1 request per 4 hours per source_id, max 2 concurrent per minute

#### Query Flow (`rag/query_pdf_ai`)

1. User submits question via Angular frontend
2. Frontend sends question to FastAPI `/rag/query-pdf` endpoint
3. FastAPI triggers `rag/query_pdf_ai` Inngest event and returns event_id
4. Angular polls Inngest API using event_id to retrieve results
5. Inngest orchestrates three-step workflow:
   - **Step 1 (embed-and-search)**: Embed question, search Qdrant for top_k matches
   - **Step 2 (llm-answer)**: Send contexts to GPT-4o-mini for answer generation
   - **Step 3**: Return answer with sources
6. Frontend displays answer and source references

### Data Flow

```
PDF Upload → Text Chunking → OpenAI Embeddings → Qdrant Vector Storage
                                                          ↓
User Question → Question Embedding → Vector Search → Context Retrieval → LLM Answer
```

## Key Components

### `main.py`
FastAPI application defining:
- Two Inngest functions (`rag_ingest_pdf`, `rag_query_pdf_ai`)
- REST API endpoints (`/rag/ingest-pdf`, `/rag/query-pdf`)
- Inngest event triggering with throttling and rate limiting
- Pydantic request/response models

### `data_loader.py`
PDF processing and embedding generation:
- `load_and_chunk_pdf()`: Reads PDF using LlamaIndex PDFReader
- `SentenceSplitter`: Chunks text (size: 1000, overlap: 200)
- `embed_texts()`: Generates embeddings using OpenAI `text-embedding-3-large` (3072 dimensions)

### `vector_db.py`
Qdrant vector database wrapper:
- `QdrantStorage` class: Manages collection creation, upsertion, and search
- Uses cosine similarity for vector search
- Auto-creates collection if not exists
- Returns contexts and sources from search results

### `custom_types.py`
Pydantic models for type safety:
- `RAGChunkAndSrc`: Chunks with source identifier
- `RAGUpsertResult`: Ingestion result count
- `RAGSearchResult`: Search contexts and sources
- `RAQQueryResult`: Final answer with metadata

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Technical Specifications

- **Embedding Model**: `text-embedding-3-large` (3072 dimensions)
- **LLM Model**: `gpt-4o-mini` (max 1024 tokens, temperature 0.2)
- **Vector Database**: Qdrant (cosine similarity)
- **Chunk Size**: 1000 characters
- **Chunk Overlap**: 200 characters
- **Default top_k**: 5 contexts

### Rate Limiting

PDF ingestion implements:
- **Throttle**: Max 2 concurrent ingestions per minute
- **Rate Limit**: 1 ingestion per source_id every 4 hours

## Development Notes

### Inngest Integration

- Uses `PydanticSerializer` for type-safe event data
- Step-based workflow execution with automatic retries
- AI inference step (`ctx.step.ai.infer`) for LLM calls
- Event ID returned for frontend polling

### Vector Storage

- UUID v5 namespaced IDs prevent duplicate chunks
- Payloads store both text and source metadata
- Collection auto-creation on first use

### Frontend Polling

Angular frontend polls Inngest API at `http://127.0.0.1:8288/v1` to retrieve function execution results using the event_id returned from FastAPI. This enables async result delivery without websockets.

### Dependencies

Key Python packages (see `pyproject.toml`):
- `fastapi>=0.120.0`
- `inngest>=0.5.10`
- `llama-index-core>=0.14.5`
- `openai>=2.6.1`
- `qdrant-client>=1.15.1`
- `uvicorn>=0.38.0`
