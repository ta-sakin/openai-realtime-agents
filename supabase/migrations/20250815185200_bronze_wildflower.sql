/*
  # Create documents table for RAG functionality

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `filename` (text) - name of the uploaded PDF file
      - `content` (text) - text content of the document chunk
      - `chunk_index` (integer) - index of the chunk within the document
      - `embedding` (vector) - vector embedding of the content
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `documents` table
    - Add policy for authenticated users to read and insert documents

  3. Functions
    - Create function to search similar documents using vector similarity
*/

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  content text NOT NULL,
  chunk_index integer NOT NULL DEFAULT 0,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create function to match documents using vector similarity
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  filename text,
  content text,
  chunk_index integer,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.filename,
    documents.content,
    documents.chunk_index,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;