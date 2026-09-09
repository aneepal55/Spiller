import {
  InMemorySessionService,
  isFinalResponse,
  LlmAgent,
  MCPToolset,
  Runner,
  stringifyContent,
  type StreamableHTTPConnectionParams,
} from "@google/adk";
import { FREE_GEMINI_MODEL } from "../scene/gemini.ts";
import type { SceneDescription } from "../scene/screenplay.ts";

export const REPLIT_MCP_URL = "https://replit-mcp.com/server/mcp";
export const REPLIT_MCP_TOOLS = [
  "create_app_from_prompt",
  "update_app_using_prompt",
  "ask_question",
] as const;

export function createReplitMcpToolset(accessToken: string) {
  const connection: StreamableHTTPConnectionParams = {
    type: "StreamableHTTPConnectionParams",
    url: process.env.REPLIT_MCP_URL?.trim() || REPLIT_MCP_URL,
    transportOptions: {
      requestInit: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    },
    timeout: 60_000,
    sseReadTimeout: 180_000,
    terminateOnClose: true,
  };
  return new MCPToolset(connection, [...REPLIT_MCP_TOOLS], "replit");
}

export function buildReplitAppPrompt(scene: SceneDescription, screenplay: string) {
  const appName = scene.title.replace(/["'\n\r]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return `Create one new Replit app from this approved film-previsualization package.

You must call replit_create_app_from_prompt exactly once. Use app_stack "3d_game" and the app name "${appName || "Untitled scene"} Previs". Ask Replit Agent to build a standalone Three.js experience that renders the scene plan below, has orbit controls and three camera presets, and clearly labels itself as a previsualization blockout. Include the screenplay in the app as read-only source material. Do not add paid APIs, subscriptions, databases, or services. Return the Replit app URL after the tool succeeds.

SCENE PLAN:
${JSON.stringify(scene)}

SOURCE SCREENPLAY:
${screenplay}`;
}

export async function publishSceneToReplit(
  scene: SceneDescription,
  screenplay: string,
  accessToken: string,
) {
  const toolset = createReplitMcpToolset(accessToken);
  const agent = new LlmAgent({
    name: "replit_previs_publisher",
    description: "Creates an approved 3D previsualization app through the official Replit MCP server.",
    model: FREE_GEMINI_MODEL,
    instruction: "Use only the Replit MCP tools. The user has already confirmed this individual create operation. Follow the requested tool arguments precisely, create at most one app, and return the resulting URL.",
    includeContents: "none",
    tools: [toolset],
  });
  const runner = new Runner({
    agent,
    appName: "cinema-previs-replit",
    sessionService: new InMemorySessionService(),
  });
  let output = "";
  try {
    for await (const event of runner.runEphemeral({
      userId: "web-user",
      newMessage: { role: "user", parts: [{ text: buildReplitAppPrompt(scene, screenplay) }] },
    })) {
      if (event.errorCode || event.errorMessage) {
        throw new Error(event.errorMessage || event.errorCode || "Replit MCP failed.");
      }
      const text = stringifyContent(event).trim();
      if (text && (isFinalResponse(event) || !event.partial)) output = text;
    }
  } finally {
    await toolset.close();
  }
  const replUrl = output.match(/https:\/\/(?:www\.)?replit\.com\/[^\s)\]}>"']+/i)?.[0];
  if (!replUrl) throw new Error(output || "Replit MCP did not return an app URL.");
  return { replUrl, message: output };
}

export function friendlyReplitError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|403|oauth|unauthenticated|access.?token/i.test(message)) {
    return "Replit MCP authorization is missing or expired. Reconnect Replit and update the server-side access token.";
  }
  if (/429|quota|allowance|resource.?exhausted/i.test(message)) {
    return "The available free Replit allowance is exhausted. Wait for it to reset; no app was created.";
  }
  return message || "Replit MCP could not create the app.";
}
