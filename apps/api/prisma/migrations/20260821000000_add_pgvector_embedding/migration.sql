-- Phase 5: Enable pgvector extension and add embedding column to products.
-- pgvector must be installed on the Postgres server (included in AWS RDS
-- for PostgreSQL 15+ and the postgres:16-alpine Docker image with
-- `apt-get install postgresql-16-pgvector` or the pgvector Docker image).

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "products" ADD COLUMN "embedding" vector(1536);

-- HNSW index for fast approximate nearest-neighbour search.
-- cosine distance (<=>)  is used in search.service.ts.
CREATE INDEX "products_embedding_hnsw_idx"
  ON "products" USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
