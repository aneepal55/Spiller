import { NextResponse } from "next/server";
import {
  AGENT_FRAMEWORK,
  FREE_GEMINI_MODEL,
  friendlyAgentError,
  generateSceneWithAgent,
} from "../../scene/gemini";
import { MAX_SCRIPT_LENGTH } from "../../scene/screenplay";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    model: FREE_GEMINI_MODEL,
    framework: AGENT_FRAMEWORK,
    agentBuilder: true,
    replitMcpConfigured: Boolean(process.env.REPLIT_MCP_ACCESS_TOKEN?.trim()),
    tier: "free",
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini is not connected. Add GEMINI_API_KEY to .env.local and restart the app." },
      { status: 503 },
    );
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be JSON." }, { status: 400 });
  }
  const screenplay = typeof payload === "object" && payload !== null && "screenplay" in payload
    ? (payload as { screenplay?: unknown }).screenplay
    : undefined;
  if (typeof screenplay !== "string" || !screenplay.trim()) {
    return NextResponse.json({ error: "Paste a short screenplay scene first." }, { status: 400 });
  }
  if (screenplay.length > MAX_SCRIPT_LENGTH) {
    return NextResponse.json({ error: `Keep the script under ${MAX_SCRIPT_LENGTH.toLocaleString()} characters.` }, { status: 413 });
  }
  try {
    const scene = await generateSceneWithAgent(screenplay);
    return NextResponse.json({
      scene,
      source: "gemini-adk",
      model: FREE_GEMINI_MODEL,
      framework: AGENT_FRAMEWORK,
    });
  } catch (error) {
    return NextResponse.json({ error: friendlyAgentError(error) }, { status: 502 });
  }
}
