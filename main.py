import logging
from fastapi import FastAPI
from pydantic import BaseModel
import inngest
import inngest.fast_api
from inngest.experimental import ai
from dotenv import load_dotenv
import uuid
import os
import datetime
from data_loader import load_and_chunk_pdf, embed_texts
from vector_db import QdrantStorage
from custom_types import RAGChunkAndSrc, RAGUpsertResult, RAGSearchResult, RAQQueryResult


load_dotenv()

inngest_client = inngest.Inngest(
    app_id="rag_app",
    logger=logging.getLogger("uvicorn"),
    is_production=False, 
    serializer=inngest.PydanticSerializer()
);

@inngest_client.create_function(
    fn_id="RAG: Ingest PDF",
    trigger=inngest.TriggerEvent(event="rag/ingest_pdf"),
    throttle=inngest.Throttle(
        limit=2, period=datetime.timedelta(minutes=1)
    ),
    rate_limit=inngest.RateLimit(
        limit=1,
        period=datetime.timedelta(hours=4),
        key="event.data.source_id"
    )
)
async def rag_ingest_pdf(ctx: inngest.Context):
    def _load(ctx: inngest.Context) -> RAGChunkAndSrc:
        pdf_path = ctx.event.data.get("pdf_path", "")
        source_id = ctx.event.data.get("source_id", pdf_path)
        chunks = load_and_chunk_pdf(pdf_path)
        return RAGChunkAndSrc(chunks=chunks, source_id=source_id)
    def _upsert(chunks_and_src: RAGChunkAndSrc) -> RAGUpsertResult:
        chunks = chunks_and_src.chunks
        source_id = chunks_and_src.source_id
        vectors = embed_texts(chunks)

        ids = [str(uuid.uuid5(uuid.NAMESPACE_URL, f"{source_id}:{i}")) for i in range(len(chunks))]
        
        payloads = [
            {"source": source_id, "text": chunks[i]} for i in range(len(chunks))
        ]
        storage = QdrantStorage()
        storage.upsert(ids, vectors, payloads)
        return RAGUpsertResult(ingested=len(ids))

    chunks_and_src = await ctx.step.run("load-and-chunk", lambda: _load(ctx), output_type=RAGChunkAndSrc)
    ingested = await ctx.step.run("embed-and-upsert", lambda: _upsert(chunks_and_src), output_type=RAGUpsertResult)
    ctx.logger.info(f"Upsert result: {ingested}")
    return ingested.model_dump()

@inngest_client.create_function(
    fn_id="RAG: Query PDF",
    trigger=inngest.TriggerEvent(event="rag/query_pdf_ai"),
)
async def rag_query_pdf_ai(ctx: inngest.Context):
    def _search(question: str, top_k: int = 5) -> RAGSearchResult:
        query_vec = embed_texts([question])[0]
        storage = QdrantStorage()
        found = storage.search(query_vec, top_k)
        return RAGSearchResult(
            contexts=found["contexts"],
            sources=found["sources"]
        )
    question = ctx.event.data["question"]
    top_k = int(ctx.event.data.get("top_k", 5))
    found = await ctx.step.run("embed-and-search", lambda: _search(question, top_k), output_type=RAGSearchResult)

    context_block = "\n\n".join(f"- {c}" for c in found.contexts)
    user_content = (
        f"Use the following context to answer the question:\n\n"
        f"Context:\n{context_block}\n\n"
        f"Question: {question}\n"
        f"Answer concisely based on the context provided."
    )

    adapter = ai.openai.Adapter(
        auth_key=os.getenv("OPENAI_API_KEY"),
        model="gpt-4o-mini"
    )

    res = await ctx.step.ai.infer(
        "llm-answer",
        adapter=adapter,
        body={
            "max_tokens": 1024,
            "temperature": 0.2,
            "messages": [
                {"role": "system", "content": "You answer questions based only on provided context."},
                {"role": "user", "content": user_content}       
            ]   
        }
    )

    answer = res["choices"][0]["message"]["content"].strip()
    return {
        "answer": answer,
        "sources": found.sources,
        "num_contexts": len(found.contexts)
    }



app = FastAPI()

# Pydantic models for API requests
class IngestPDFRequest(BaseModel):
    pdf_path: str
    source_id: str = None

class QueryPDFRequest(BaseModel):
    question: str
    top_k: int = 5

# REST API endpoints
@app.post("/rag/ingest-pdf")
async def api_ingest_pdf(request: IngestPDFRequest):
    """
    Trigger PDF ingestion via REST API
    """
    event_data = {
        "pdf_path": request.pdf_path,
        "source_id": request.source_id or request.pdf_path
    }
    
    # Send event to Inngest
    await inngest_client.send(inngest.Event(
        name="rag/ingest_pdf",
        data=event_data
    ))
    
    return {
        "message": "PDF ingestion started",
        "pdf_path": request.pdf_path,
        "source_id": event_data["source_id"]
    }

@app.post("/rag/query-pdf")
async def api_query_pdf(request: QueryPDFRequest):
    """
    Trigger PDF query via REST API
    """
    event_data = {
        "question": request.question,
        "top_k": request.top_k
    }
    
    # Send event to Inngest
    await inngest_client.send(inngest.Event(
        name="rag/query_pdf_ai",
        data=event_data
    ))
    
    return {
        "message": "PDF query started",
        "question": request.question,
        "top_k": request.top_k
    }

inngest.fast_api.serve(app, inngest_client, [rag_ingest_pdf, rag_query_pdf_ai])