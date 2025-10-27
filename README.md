##Main Server
uvicorn main:app --reload

inngest
npx inngest-cli@latest dev -u http://127.0.0.1:8000/api/inngest


docker run -d --name qdrant -p 6333:6333 -v "$(pwd)/qdrant_storage:/qdrant/storage" qdrant/qdrant


streamlit run streamlit_app.py