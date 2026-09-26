import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

// Les routes qui modifient la bibliothèque partagée exigent
// "Authorization: Bearer <ADMIN_TOKEN>". Sans ADMIN_TOKEN, elles sont désactivées.
export function requireAdmin(request: NextRequest): NextResponse | null {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json(
      { success: false, error: "Library editing is disabled (ADMIN_TOKEN not set)" },
      { status: 403 }
    );
  }

  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  // Hash des deux côtés pour comparer des buffers de même longueur
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(digest(provided), digest(adminToken))) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}
