import { NextRequest, NextResponse } from 'next/server';
import { getFeedById, updateFeedInLibrary, deleteFeedFromLibrary } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

// GET - Récupérer un flux par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid feed ID' },
        { status: 400 }
      );
    }

    const feed = getFeedById(id);

    if (!feed) {
      return NextResponse.json(
        { success: false, error: 'Feed not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: feed });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un flux
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid feed ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { categoryId, title, url, description, language } = body;

    if (!categoryId || !title || !url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: categoryId, title, url' },
        { status: 400 }
      );
    }

    // Vérifier si le flux existe
    const existingFeed = getFeedById(id);
    if (!existingFeed) {
      return NextResponse.json(
        { success: false, error: 'Feed not found' },
        { status: 404 }
      );
    }

    updateFeedInLibrary(
      id,
      categoryId,
      title,
      url,
      description || null,
      language || 'fr'
    );

    return NextResponse.json({
      success: true,
      message: 'Feed updated successfully'
    });
  } catch (error: unknown) {
    console.error('Error updating feed:', error);

    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { success: false, error: 'A feed with this URL already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update feed' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un flux
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid feed ID' },
        { status: 400 }
      );
    }

    // Vérifier si le flux existe
    const existingFeed = getFeedById(id);
    if (!existingFeed) {
      return NextResponse.json(
        { success: false, error: 'Feed not found' },
        { status: 404 }
      );
    }

    deleteFeedFromLibrary(id);

    return NextResponse.json({
      success: true,
      message: 'Feed deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete feed' },
      { status: 500 }
    );
  }
}
