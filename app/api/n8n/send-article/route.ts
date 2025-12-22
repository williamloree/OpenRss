import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { article, webhookUrl: clientWebhookUrl, target } = body;

    // Use client-provided webhook URL or fallback to env variable
    const webhookUrl = clientWebhookUrl || process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Webhook URL not configured. Please set it in Settings." },
        { status: 400 }
      );
    }

    console.log("[n8n] Sending article to webhook:", article.title, "Target:", target || "both");

    // Send article data to n8n webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: article.title,
        link: article.link,
        author: article.author,
        pubDate: article.pubDate,
        content: article.content?.summary || "",
        image: article.attachements?.articleImg || article.enclosure?.link || "",
        guid: article.guid,
        target: target || "both", // Add target field (notion, discord, or both)
      }),
    });

    if (!response.ok) {
      console.error("[n8n] Webhook failed:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Failed to send to webhook" },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log("[n8n] Article sent successfully");

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[n8n] Error sending article:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
