import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateEmbedding } from '@/app/lib/supabase';
import pdf from 'pdf-parse';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Extract text from PDF
    const pdfData = await pdf(buffer);
    const text = pdfData.text;

    if (!text.trim()) {
      return NextResponse.json({ error: 'No text found in PDF' }, { status: 400 });
    }

    // Split text into chunks (approximately 1000 characters each)
    const chunks = splitTextIntoChunks(text, 1000);
    
    // Process each chunk
    const processedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);
      
      const { data, error } = await supabase
        .from('documents')
        .insert({
          filename: file.name,
          content: chunk,
          chunk_index: i,
          embedding: embedding,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting chunk:', error);
        continue;
      }

      processedChunks.push(data);
    }

    return NextResponse.json({ 
      message: 'PDF processed successfully',
      chunks: processedChunks.length,
      filename: file.name
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
  }
}

function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
      }
      currentChunk = trimmedSentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk + '.');
  }

  return chunks;
}