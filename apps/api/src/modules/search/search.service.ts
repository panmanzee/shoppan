/**
 * Semantic search via pgvector.
 *
 * When OpenAI is configured: embeds the query, then finds the k-nearest
 * product embeddings using cosine distance (<=>).
 *
 * When OpenAI is NOT configured (or no products have embeddings yet):
 * falls back to Postgres full-text search using `to_tsvector` + `to_tsquery`
 * so the endpoint always returns useful results.
 */
import { prisma } from "@/lib/prisma";
import { generateEmbedding, toVectorLiteral } from "@/lib/embeddings/openai";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  seller: { storeName: string; slug: string };
  category: { name: string; slug: string };
  score: number;
}

export async function semanticSearch(
  query: string,
  limit = 20,
  offset = 0,
): Promise<SearchResult[]> {
  const embedding = await generateEmbedding(query);

  if (embedding) {
    return vectorSearch(query, embedding, limit, offset);
  }
  return textSearch(query, limit, offset);
}

async function vectorSearch(
  query: string,
  embedding: number[],
  limit: number,
  offset: number,
): Promise<SearchResult[]> {
  const vectorLiteral = toVectorLiteral(embedding);

  // Hybrid search: cosine similarity on embedding + full-text relevance boost.
  // Products without an embedding are excluded (embedding IS NOT NULL).
  const rows = await prisma.$queryRaw<SearchResult[]>`
    SELECT
      p.id,
      p.title,
      p.description,
      p."priceCents",
      p."imageUrl",
      json_build_object('storeName', sp."storeName", 'slug', sp.slug) AS seller,
      json_build_object('name', c.name, 'slug', c.slug)               AS category,
      1 - (p.embedding <=> ${vectorLiteral}::vector)                  AS score
    FROM products p
    JOIN seller_profiles sp ON sp.id = p."sellerId"
    JOIN categories c       ON c.id  = p."categoryId"
    WHERE p."isActive" = true
      AND p.embedding IS NOT NULL
    ORDER BY p.embedding <=> ${vectorLiteral}::vector
    LIMIT ${limit} OFFSET ${offset}
  `;

  // If vector search returned nothing (no embeddings in DB yet), fall back
  if (rows.length === 0) {
    return textSearch(query, limit, offset);
  }

  return rows;
}

async function textSearch(
  query: string,
  limit: number,
  offset: number,
): Promise<SearchResult[]> {
  const rows = await prisma.$queryRaw<SearchResult[]>`
    SELECT
      p.id,
      p.title,
      p.description,
      p."priceCents",
      p."imageUrl",
      json_build_object('storeName', sp."storeName", 'slug', sp.slug) AS seller,
      json_build_object('name', c.name, 'slug', c.slug)               AS category,
      ts_rank(
        to_tsvector('english', p.title || ' ' || p.description),
        plainto_tsquery('english', ${query})
      ) AS score
    FROM products p
    JOIN seller_profiles sp ON sp.id = p."sellerId"
    JOIN categories c       ON c.id  = p."categoryId"
    WHERE p."isActive" = true
      AND to_tsvector('english', p.title || ' ' || p.description)
          @@ plainto_tsquery('english', ${query})
    ORDER BY score DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  return rows;
}

/**
 * Generate and store embeddings for all products that don't have one yet.
 * Run this once after enabling OPENAI_API_KEY (e.g., via a one-off script
 * or an admin endpoint). Processes in batches to avoid rate limits.
 */
export async function backfillEmbeddings(): Promise<{ updated: number; skipped: number }> {
  const products = await prisma.$queryRaw<{ id: string; title: string; description: string }[]>`
    SELECT id, title, description FROM products WHERE embedding IS NULL AND "isActive" = true
  `;

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const text = `${product.title} ${product.description}`;
    const embedding = await generateEmbedding(text);

    if (!embedding) {
      skipped++;
      continue;
    }

    await prisma.$executeRaw`
      UPDATE products SET embedding = ${toVectorLiteral(embedding)}::vector WHERE id = ${product.id}
    `;
    updated++;
  }

  return { updated, skipped };
}
