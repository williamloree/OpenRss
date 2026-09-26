import { NextRequest, NextResponse } from "next/server";
import {
  assertValidEndpoint,
  deleteSubscription,
  MAX_FEEDS_PER_SUBSCRIPTION,
  PushFeed,
  saveSubscription,
} from "@/lib/push";
import { UnsafeUrlError } from "@/lib/safe-fetch";

// POST - Créer ou mettre à jour un abonnement (et la liste des flux suivis)
export async function POST(request: NextRequest) {
  try {
    const { subscription, feeds } = await request.json();

    if (
      typeof subscription?.endpoint !== "string" ||
      typeof subscription?.keys?.p256dh !== "string" ||
      typeof subscription?.keys?.auth !== "string"
    ) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    if (
      !Array.isArray(feeds) ||
      feeds.length > MAX_FEEDS_PER_SUBSCRIPTION ||
      !feeds.every((feed) => typeof feed?.url === "string")
    ) {
      return NextResponse.json(
        { error: `feeds must be an array of at most ${MAX_FEEDS_PER_SUBSCRIPTION} { url, title }` },
        { status: 400 }
      );
    }

    await assertValidEndpoint(subscription.endpoint);

    const cleanFeeds: PushFeed[] = feeds.map((feed) => ({
      url: feed.url,
      title: typeof feed.title === "string" && feed.title ? feed.title.slice(0, 200) : feed.url,
    }));

    saveSubscription(subscription, cleanFeeds);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[push] Error saving subscription:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

// DELETE - Se désabonner
export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    if (typeof endpoint !== "string") {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }
    deleteSubscription(endpoint);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[push] Error deleting subscription:", error);
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
  }
}
