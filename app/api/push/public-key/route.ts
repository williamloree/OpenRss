import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ publicKey: getVapidPublicKey() });
  } catch (error) {
    console.error("[push] Error reading VAPID key:", error);
    return NextResponse.json(
      { error: "Push notifications unavailable" },
      { status: 503 }
    );
  }
}
