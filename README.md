# RAG Data Query System
An event-driven RAG (Retrieval-Augmented Generation) application that allows you to upload PDF documents and query them using AI. Built with FastAPI, Inngest, Qdrant vector database, and Angular 20.

## Features

- 📄 **PDF Ingestion**: Upload and process PDF documents into searchable vector embeddings
- 🤖 **AI-Powered Querying**: Ask questions and receive context-aware answers from your documents
- ⚡ **Event-Driven Architecture**: Asynchronous processing using Inngest workflows
- 🔍 **Vector Search**: Fast similarity search using Qdrant vector database
- 🎨 **Modern Frontend**: Angular 20 with Tailwind CSS
- 🛡️ **Rate Limiting**: Built-in throttling and rate limiting for PDF ingestion

## Quick Start

### Prerequisites

- Python 3.13+
- Node.js 18+
- Docker (for Qdrant)
- OpenAI API key

### 1. Environment Setup

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Install Dependencies

```bash
# Python dependencies (using uv or pip)
uv sync
# or
pip install -e .
```

### 3. Start Services

#### Terminal 1: Start Qdrant (Vector Database)
```bash
docker run -d --name qdrant -p 6333:6333 -v "$(pwd)/qdrant_storage:/qdrant/storage" qdrant/qdrant
```

#### Terminal 2: Start FastAPI Backend
```bash
uvicorn main:app --reload
```

#### Terminal 3: Start Inngest Dev Server
```bash
npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest
```

#### Terminal 4: Start Angular Frontend
```bash
cd frontend
npm install
npm start
```

### 4. Access the Application

- **Frontend**: http://localhost:4200
- **FastAPI Backend**: http://localhost:8000
- **Inngest Dashboard**: http://localhost:8288
- **Qdrant Dashboard**: http://localhost:6333/dashboard

## Usage

1. **Upload a PDF**: Use the frontend to upload a PDF file for ingestion
2. **Wait for Processing**: The system will chunk the PDF and generate embeddings
3. **Ask Questions**: Enter questions about your document
4. **View Answers**: Receive AI-generated answers with source references

## Architecture

This system uses an event-driven architecture with three main components:

### Backend Components

1. **FastAPI Server** - REST API endpoints and Inngest function definitions
2. **Inngest** - Event orchestration and workflow management
3. **Qdrant** - Vector database for similarity search
4. **OpenAI** - Text embeddings and LLM responses

### Workflow

**PDF Ingestion:**
```
PDF Upload → FastAPI → Inngest Event → Load & Chunk → Generate Embeddings → Store in Qdrant
```

**Query Processing:**
```
User Question → FastAPI → Inngest Event → Embed Question → Vector Search → LLM Answer → Frontend
```

## Project Structure

```
.
├── main.py              # FastAPI app with Inngest functions
├── data_loader.py       # PDF processing and embedding generation
├── vector_db.py         # Qdrant database wrapper
├── custom_types.py      # Pydantic models
├── pyproject.toml       # Python dependencies
├── frontend/            # Angular application
└── WARP.md             # Detailed technical documentation
```

## Technical Details

- **Embedding Model**: OpenAI `text-embedding-3-large` (3072 dimensions)
- **LLM Model**: OpenAI `gpt-4o-mini`
- **Chunking**: 1000 characters with 200 character overlap
- **Vector Search**: Cosine similarity, top-k=5 by default
- **Rate Limiting**: 1 ingestion per source every 4 hours, max 2 concurrent

## API Endpoints

### POST `/rag/ingest-pdf`
Trigger PDF ingestion

```json
{
  "pdf_path": "path/to/file.pdf",
  "source_id": "optional_identifier"
}
```

### POST `/rag/query-pdf`
Query indexed PDFs

```json
{
  "question": "What is this document about?",
  "top_k": 5
}
```

## Frontend

The Angular frontend provides a modern UI for interacting with the RAG system. See `frontend/README.md` for detailed frontend documentation.

## Development

For detailed development information, architecture details, and technical specifications, see `WARP.md`.

## License

MIT
