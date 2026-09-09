import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSceneDescription, parseScreenplay, samples, MAX_SCRIPT_LENGTH } from "../app/scene/screenplay.ts";
import { buildScene, shotsForScene, disposeScene } from "../app/scene/desert-scene.ts";
import { AGENT_FRAMEWORK, FREE_GEMINI_MODEL, rootAgent, sceneResponseSchema } from "../app/scene/gemini.ts";
import { buildReplitAppPrompt, REPLIT_MCP_TOOLS, REPLIT_MCP_URL } from "../app/agent/replit.ts";

const kinds = (scene, kind) => scene.objects.filter((object) => object.kind === kind);

test("different user scripts produce different environments, props and lighting", () => {
  const highway = parseScreenplay(samples.highway);
  const room = parseScreenplay(samples.room);
  assert.equal(highway.environment, "desert");
  assert.equal(highway.lighting, "sunset");
  assert.equal(kinds(highway, "car").length, 1);
  assert.equal(kinds(highway, "person")[0].name, "Mara");
  assert.equal(room.environment, "room");
  assert.equal(room.lighting, "night");
  assert.equal(kinds(room, "car").length, 0);
  assert.equal(kinds(room, "chair").length, 2);
  assert.deepEqual(kinds(room, "person").map((o) => o.name), ["JUNE", "ELI"]);
});

test("only the first scene and action props are used, not dialogue mentions", () => {
  const scene = parseScreenplay("INT. OFFICE - DAY\n\nA table.\n\nMARA\nI left my car by the trees.\n\nEXT. PARK - NIGHT\n\nThree cars.");
  assert.equal(kinds(scene, "car").length, 0);
  assert.equal(kinds(scene, "tree").length, 0);
  assert.equal(scene.lighting, "day");
  assert.ok(scene.notes.some((note) => note.includes("Only the first scene")));
});

test("empty and oversized input fail; unrecognized text produces an honest empty stage", () => {
  assert.throws(() => parseScreenplay(" \n"), /Paste/);
  assert.throws(() => parseScreenplay("x".repeat(MAX_SCRIPT_LENGTH + 1)), /under/);
  const scene = parseScreenplay("EXT. SPACE - NIGHT\n\nA spaceship floats past a satellite.");
  assert.equal(scene.objects.length, 0);
  assert.equal(scene.environment, "open");
  assert.ok(scene.notes.some((note) => note.includes("No supported")));
});

test("counts are bounded, mentions deduplicate, and JSON round-trips", () => {
  const scene = parseScreenplay("EXT. PARK - DAY\n\n999 cars and two chairs. The chairs are empty. Mara stands near a tree.\n\nMARA\nHello.");
  assert.equal(kinds(scene, "car").length, 8);
  assert.equal(kinds(scene, "chair").length, 2);
  assert.equal(kinds(scene, "person").length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(scene)), scene);
  assert.equal(new Set(scene.objects.map((o) => o.id)).size, scene.objects.length);
});

test("scene data determines rendered objects and their exact positions", () => {
  for (const script of Object.values(samples)) {
    const description = parseScreenplay(script);
    description.objects[0].position = [7, 0, -4];
    const scene = buildScene(description);
    const rendered = scene.children.filter((o) => o.userData.id);
    assert.equal(rendered.length, description.objects.length);
    for (const object of description.objects) {
      const group = rendered.find((o) => o.userData.id === object.id);
      assert.equal(group.userData.kind, object.kind);
      assert.deepEqual(group.position.toArray(), object.position);
      assert.ok(group.children.length > 0);
    }
    for (const preset of Object.values(shotsForScene(description))) {
      assert.ok(preset.position.every(Number.isFinite));
      assert.ok(preset.target.every(Number.isFinite));
    }
    disposeScene(scene);
  }
});

test("Gemini scene data is validated before reaching the renderer", () => {
  const rawScene = {
    title: "EXT. MOON - NIGHT",
    environment: "open",
    road: false,
    lighting: "night",
    objects: [{
      id: "lander 1",
      kind: "prop",
      name: "Lunar lander",
      shape: "cylinder",
      position: [999, 0, -999],
      size: [3, 4, 3],
      rotationY: 0.4,
      color: "#cccccc",
      description: "The crew's lander",
    }],
    notes: ["The lunar surface uses the neutral stage."],
  };
  const scene = normalizeSceneDescription(rawScene);
  assert.deepEqual(scene.objects[0].position, [25, 0, -25]);
  assert.equal(scene.objects[0].id, "lander-1");
  assert.deepEqual(normalizeSceneDescription(scene), scene);
});

test("the screenplay workflow is a Gemini-powered Google ADK agent", () => {
  assert.equal(rootAgent.name, "cinema_previs_agent");
  assert.equal(rootAgent.model, FREE_GEMINI_MODEL);
  assert.ok(sceneResponseSchema.safeParse({
    title: "EXT. PARK - DAY",
    environment: "park",
    road: false,
    lighting: "day",
    objects: [],
    notes: [],
  }).success);
  assert.match(AGENT_FRAMEWORK, /Google Cloud Agent Builder/);
});

test("the Replit partner handoff uses the official MCP server and a 3D game request", () => {
  const scene = parseScreenplay(samples.park);
  const prompt = buildReplitAppPrompt(scene, samples.park);
  assert.equal(REPLIT_MCP_URL, "https://replit-mcp.com/server/mcp");
  assert.ok(REPLIT_MCP_TOOLS.includes("create_app_from_prompt"));
  assert.match(prompt, /replit_create_app_from_prompt exactly once/);
  assert.match(prompt, /app_stack "3d_game"/);
  assert.match(prompt, /Do not add paid APIs/);
});
