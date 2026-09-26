import { NextResponse } from 'next/server';
import { getAllFeedsByCategory } from '@/lib/feeds-library';

// Généré au build depuis lib/feeds-library.json
export const dynamic = 'force-static';

// GET - Récupérer tous les flux de la bibliothèque, groupés par catégorie
export async function GET() {
  return NextResponse.json({ success: true, data: getAllFeedsByCategory() });
}
