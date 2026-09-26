import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { checkFeedsAndNotify } from "@/lib/push";

// POST - Lancer une vérification immédiate (admin, utile pour tester)
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const result = await checkFeedsAndNotify();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[push] Manual check failed:", error);
    return NextResponse.json({ success: false, error: "Check failed" }, { status: 500 });
  }
}
