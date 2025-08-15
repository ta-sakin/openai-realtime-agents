import { NextRequest, NextResponse } from 'next/server';
import { searchSimilarDocuments } from '@/app/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 5 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const results = await searchSimilarDocuments(query, limit);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching documents:', error);
    return NextResponse.json({ error: 'Failed to search documents' }, { status: 500 });
  }
}