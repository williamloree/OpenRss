import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
  try {
    const response = await fetch('https://api.github.com/repos/williamloree/OpenRss', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'OpenRss-App',
      },
      next: {
        revalidate: 3600, // Revalidate every hour
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      stars: data.stargazers_count || 0,
      url: data.html_url || 'https://github.com/williamloree/OpenRss',
    });
  } catch (error) {
    console.error('[GitHub Stars API] Error fetching stars:', error);

    return NextResponse.json(
      {
        stars: 0,
        url: 'https://github.com/williamloree/OpenRss',
        error: 'Failed to fetch stars',
      },
      { status: 200 }
    );
  }
}
