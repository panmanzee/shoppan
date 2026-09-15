/**
 * Thin wrapper around OpenAI's text-embedding-3-small model.
 *
 * Returns a 1536-dimensional float array, or null if OPENAI_API_KEY is not
 * configured. Callers should handle null gracefully (fall back to text search).
 */
import OpenAI from "openai";
import { env } from "@/config/env";

const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!openai) return null;

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.replace(/\n/g, " "),
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

/** Formats a number array as a Postgres vector literal: '[0.1, 0.2, ...]' */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
