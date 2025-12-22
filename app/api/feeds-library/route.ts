import { NextRequest, NextResponse } from 'next/server';
import { getAllFeedsByCategory, addFeedToLibrary, getAllCategories } from '@/lib/db';

// GET - Récupérer tous les flux ou toutes les catégories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'categories') {
      const categories = getAllCategories();
      return NextResponse.json({ success: true, data: categories });
    }

    const feedsByCategory = getAllFeedsByCategory();
    return NextResponse.json({ success: true, data: feedsByCategory });
  } catch (error) {
    console.error('Error fetching feeds library:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feeds library' },
      { status: 500 }
    );
  }
}

// POST - Ajouter un nouveau flux à la bibliothèque
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, title, url, description, language } = body;

    if (!categoryId || !title || !url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: categoryId, title, url' },
        { status: 400 }
      );
    }

    const feedId = addFeedToLibrary(
      categoryId,
      title,
      url,
      description || null,
      language || 'fr'
    );

    return NextResponse.json({
      success: true,
      data: { id: feedId },
      message: 'Feed added successfully'
    });
  } catch (error: unknown) {
    console.error('Error adding feed to library:', error);

    if (error instanceof Error && error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { success: false, error: 'A feed with this URL already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to add feed to library' },
      { status: 500 }
    );
  }
}
