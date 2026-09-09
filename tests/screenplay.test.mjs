import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSceneDescription, parseScreenplay, samples, MAX_SCRIPT_LENGTH } from "../app/scene/screenplay.ts";
import { buildScene, shotsForScene, disposeScene } from "../app/scene/desert-scene.ts";
import { AGENT_FRAMEWORK, FREE_GEMINI_MODEL, rootAgent, sceneResponseSchema } from "../app/scene/gemini.ts";

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

test("classroom boards are recognized and mounted on the front wall", () => {
  const scene = normalizeSceneDescription({
    title: "INT. CLASSROOM - NIGHT",
    environment: "room",
    road: false,
    lighting: "night",
    objects: [{
      id: "message",
      kind: "prop",
      name: "Blackboard",
      shape: "box",
      position: [20, 0, 4],
      size: [4.5, 1.5, 0.12],
      rotationY: 0,
      color: "#17251e",
      description: "A message appears on the blackboard",
    }],
    notes: [],
  });
  assert.equal(scene.objects[0].kind, "board");
  assert.deepEqual(scene.objects[0].position, [6, 1.8, -8.85]);
  const rendered = buildScene(scene).children.find((object) => object.userData.id === "message");
  assert.equal(rendered.children.length, 5);
});

test("rooftop action preserves airborne props, attachments, and character pose", () => {
  const scene = normalizeSceneDescription({
    title: "EXT. ROOFTOP - SUNSET",
    environment: "rooftop",
    road: false,
    lighting: "sunset",
    objects: [
      { id: "leo", kind: "person", name: "Leo", shape: "cylinder", position: [0, 0, 1], size: [0.7, 1.8, 0.7], rotationY: 0, color: "#334455", placement: "floor", pose: "reaching", attachedTo: "", description: "Leo reaches toward the balloon." },
      { id: "balloon", kind: "balloon", name: "Red balloon", shape: "sphere", position: [0.8, 2.5, 0.5], size: [0.45, 0.6, 0.45], rotationY: 0, color: "#cc332b", placement: "airborne", pose: "neutral", attachedTo: "", description: "A balloon rising beside Leo." },
      { id: "message", kind: "paper", name: "Tied message", shape: "box", position: [0.8, 1.55, 0.5], size: [0.25, 0.16, 0.02], rotationY: 0, color: "#eee5cf", placement: "airborne", pose: "neutral", attachedTo: "balloon", description: "A message tied to the string." },
    ],
    notes: [],
  });
  assert.equal(scene.environment, "rooftop");
  assert.equal(scene.objects[0].pose, "reaching");
  assert.equal(scene.objects[1].placement, "airborne");
  assert.equal(scene.objects[2].attachedTo, "balloon");
  const rendered = buildScene(scene);
  assert.ok(rendered.children.find((object) => object.userData.id === "balloon")?.children.length >= 2);
  assert.ok(rendered.children.length > scene.objects.length + 10, "rooftop architecture and skyline should be automatic");
  disposeScene(rendered);
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
