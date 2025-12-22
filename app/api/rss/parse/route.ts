import { NextResponse } from "next/server";
import { parseRssFeed } from "@/lib/rss-parser";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const rssUrl = searchParams.get("url");

  if (!rssUrl) {
    return NextResponse.json(
      {
        error: "Missing 'url' query param",
      },
      { status: 400 }
    );
  }

  try {
    const data = await parseRssFeed(rssUrl);
    return NextResponse.json(data);
  } catch (error) {
    console.log("🚀 ~ GET ~ error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch RSS feed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
