import { NextResponse } from "next/server";
import { parseMultipleRssFeeds } from "@/lib/rss-parser";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        {
          error: "Missing or invalid 'urls' array in request body",
        },
        { status: 400 }
      );
    }

    if (!urls.every((url) => typeof url === "string")) {
      return NextResponse.json(
        {
          error: "All URLs must be strings",
        },
        { status: 400 }
      );
    }

    const data = await parseMultipleRssFeeds(urls);
    return NextResponse.json(data);
  } catch (error) {
    console.log("🚀 ~ POST ~ error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch RSS feeds",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
