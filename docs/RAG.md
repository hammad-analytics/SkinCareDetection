# RAG

Trusted knowledge documents are stored in MongoDB with source, title, category, content, chunk, metadata, and optional embedding reference fields.

The current prototype uses MongoDB text search as a lightweight retrieval layer. A vector database can replace this behind the same `retrieveKnowledge` interface once embeddings are configured.
