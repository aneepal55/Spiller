import { NextResponse } from "next/server";
import { friendlyReplitError, publishSceneToReplit } from "../../agent/replit";
import {
  MAX_SCRIPT_LENGTH,
  normalizeSceneDescription,
} from "../../scene/screenplay";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.REPLIT_MCP_ACCESS_TOKEN?.trim()),
    provider: "Replit",
    protocol: "MCP",
  });
}

export async function POST(request: Request) {
  const accessToken = process.env.REPLIT_MCP_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Replit MCP is not connected. Add an OAuth access token to REPLIT_MCP_ACCESS_TOKEN and restart the app." },
      { status: 503 },
    );
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be JSON." }, { status: 400 });
  }
  if (typeof payload !== "object" || payload === null || !("confirmed" in payload) || (payload as { confirmed?: unknown }).confirmed !== true) {
    return NextResponse.json({ error: "Confirm this individual Replit app creation first." }, { status: 400 });
  }
  const screenplay = "screenplay" in payload ? (payload as { screenplay?: unknown }).screenplay : undefined;
  const rawScene = "scene" in payload ? (payload as { scene?: unknown }).scene : undefined;
  if (typeof screenplay !== "string" || !screenplay.trim() || screenplay.length > MAX_SCRIPT_LENGTH) {
    return NextResponse.json({ error: "Send the generated scene and its screenplay." }, { status: 400 });
  }
  try {
    const scene = normalizeSceneDescription(rawScene);
    const result = await publishSceneToReplit(scene, screenplay, accessToken);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: friendlyReplitError(error) }, { status: 502 });
  }
}
