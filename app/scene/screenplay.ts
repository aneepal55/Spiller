export const objectKinds = [
  "person", "car", "table", "chair", "tree", "bed", "sofa", "lamp",
  "door", "window", "building", "rock", "prop",
] as const;
export const shapes = ["box", "sphere", "cylinder", "cone"] as const;
export const environments = ["desert", "park", "room", "street", "forest", "beach", "city", "open"] as const;
export const lightingModes = ["day", "sunset", "night", "indoor"] as const;

export type ObjectKind = (typeof objectKinds)[number];
export type Shape = (typeof shapes)[number];
export type Environment = (typeof environments)[number];
export type Lighting = (typeof lightingModes)[number];
export type Vector3Tuple = [number, number, number];

export type SceneObject = {
  id: string;
  kind: ObjectKind;
  name: string;
  shape: Shape;
  position: Vector3Tuple;
  size: Vector3Tuple;
  rotationY: number;
  color: string;
  description: string;
};

export type SceneDescription = {
  version: 1;
  title: string;
  environment: Environment;
  road: boolean;
  lighting: Lighting;
  objects: SceneObject[];
  notes: string[];
};

export const MAX_SCRIPT_LENGTH = 12000;
export const MAX_SCENE_OBJECTS = 30;
export const samples = {
  highway: "EXT. DESERT HIGHWAY - SUNSET\n\nMara stands beside a stalled red car. The road stretches into the desert.",
  room: "INT. LIVING ROOM - NIGHT\n\nA wooden table and two chairs sit beneath a floor lamp. A blue sofa faces the window.\n\nJUNE\nDid you hear that?\n\nELI\nStay here.",
  park: "EXT. PARK - DAY\n\nThree trees surround a picnic table. Alex walks across the grass. Sam waits near a stone bench.",
};

const counts: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
const cuePattern = /^[A-Z][A-Z '’.-]{1,35}(?:\s*\((?:V\.O\.|O\.S\.|CONT'D)\))?$/;
const headingPattern = /^\s*(?:INT\.?\/EXT\.?|EXT\.?\/INT\.?|INT\.?|EXT\.?)\s+/i;
const defaults: Record<ObjectKind, { shape: Shape; size: Vector3Tuple; color: string }> = {
  person: { shape: "cylinder", size: [0.7, 1.8, 0.7], color: "#d5be8d" },
  car: { shape: "box", size: [1.8, 1.5, 4], color: "#a65338" },
  table: { shape: "box", size: [2, 0.9, 1.3], color: "#825c3e" },
  chair: { shape: "box", size: [0.7, 1, 0.7], color: "#78604a" },
  tree: { shape: "cone", size: [2.2, 4, 2.2], color: "#426844" },
  bed: { shape: "box", size: [2, 0.7, 3.5], color: "#cab99f" },
  sofa: { shape: "box", size: [2.6, 1, 1], color: "#536b78" },
  lamp: { shape: "cone", size: [0.8, 2.1, 0.8], color: "#d9b56f" },
  door: { shape: "box", size: [1, 2.2, 0.15], color: "#725139" },
  window: { shape: "box", size: [1.8, 1.4, 0.1], color: "#8fc1d7" },
  building: { shape: "box", size: [6, 5, 5], color: "#989081" },
  rock: { shape: "sphere", size: [1.2, 0.7, 1], color: "#786f63" },
  prop: { shape: "box", size: [1, 1, 1], color: "#a58a68" },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cleanText(value: unknown, fallback: string, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function enumValue<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  return typeof value === "string" && allowed.includes(value as T[number]) ? value as T[number] : fallback;
}

function vector(value: unknown, fallback: Vector3Tuple, min: number, max: number): Vector3Tuple {
  if (!Array.isArray(value) || value.length !== 3) return [...fallback];
  return value.map((part, index) => {
    const number = typeof part === "number" && Number.isFinite(part) ? part : fallback[index];
    return clamp(number, min, max);
  }) as Vector3Tuple;
}

/** Turns untrusted model output into bounded renderer data. */
export function normalizeSceneDescription(value: unknown): SceneDescription {
  if (!isRecord(value)) throw new Error("Gemini returned an invalid scene description.");
  const environment = enumValue(value.environment, environments, "open");
  const lighting = enumValue(value.lighting, lightingModes, environment === "room" ? "indoor" : "day");
  const rawObjects = Array.isArray(value.objects) ? value.objects.slice(0, MAX_SCENE_OBJECTS) : [];
  const ids = new Set<string>();
  const objects = rawObjects.flatMap((raw, index): SceneObject[] => {
    if (!isRecord(raw)) return [];
    const kind = enumValue(raw.kind, objectKinds, "prop");
    const preset = defaults[kind];
    let id = cleanText(raw.id, `${kind}-${index + 1}`, 50).replace(/[^a-zA-Z0-9_-]/g, "-");
    while (ids.has(id)) id = `${id}-${index + 1}`;
    ids.add(id);
    const color = typeof raw.color === "string" && /^#[0-9a-f]{6}$/i.test(raw.color) ? raw.color : preset.color;
    return [{
      id,
      kind,
      name: cleanText(raw.name, `${kind} ${index + 1}`, 70),
      shape: enumValue(raw.shape, shapes, preset.shape),
      position: vector(raw.position, [((index % 5) - 2) * 2.5, 0, Math.floor(index / 5) * 3], -25, 25),
      size: vector(raw.size, preset.size, 0.15, 15),
      rotationY: clamp(typeof raw.rotationY === "number" && Number.isFinite(raw.rotationY) ? raw.rotationY : 0, -6.3, 6.3),
      color,
      description: cleanText(raw.description, "", 180),
    }];
  });
  const notes = (Array.isArray(value.notes) ? value.notes : [])
    .filter((note): note is string => typeof note === "string" && Boolean(note.trim()))
    .slice(0, 6)
    .map((note) => note.trim().slice(0, 240));
  return {
    version: 1,
    title: cleanText(value.title, "Untitled scene", 100),
    environment,
    road: Boolean(value.road),
    lighting,
    objects,
    notes,
  };
}

/** A bounded local fallback. It never executes text or calls a service. */
export function parseScreenplay(input: string): SceneDescription {
  if (!input.trim()) throw new Error("Paste a short scene before generating.");
  if (input.length > MAX_SCRIPT_LENGTH) throw new Error(`Keep your script under ${MAX_SCRIPT_LENGTH.toLocaleString()} characters.`);
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const headings = lines.map((line, i) => headingPattern.test(line) ? i : -1).filter((i) => i >= 0);
  const start = headings[0] ?? 0;
  const end = headings[1] ?? lines.length;
  const selected = lines.slice(start, end);
  const heading = headings.length ? selected.shift()!.trim() : "Untitled scene";
  const names = new Set<string>();
  const action: string[] = [];
  let inDialogue = false;
  for (const raw of selected) {
    const line = raw.trim();
    if (!line) { inDialogue = false; continue; }
    if (/^(?:CUT TO|FADE IN|FADE OUT|DISSOLVE TO|THE END)[:.]?$/i.test(line)) continue;
    if (cuePattern.test(line) && !/[.!?]$/.test(line.replace(/\([^)]*\)$/, ""))) {
      names.add(line.replace(/\s*\([^)]*\)$/, "").trim());
      inDialogue = true;
    } else if (!inDialogue && !/^\(/.test(line)) action.push(line);
  }
  const text = `${heading === "Untitled scene" ? "" : heading}\n${action.join("\n")}`;
  const environment: Environment = /^INT\b/i.test(heading) || /\b(room|kitchen|office|bedroom|apartment|cafe)\b/i.test(text) ? "room"
    : /\b(desert|dunes?)\b/i.test(text) ? "desert"
    : /\b(forest|woods)\b/i.test(text) ? "forest"
    : /\b(park|garden)\b/i.test(text) ? "park"
    : /\b(street|highway|road)\b/i.test(text) ? "street" : "open";
  const lighting: Lighting = /\b(night|midnight)\b/i.test(heading) ? "night"
    : /\b(sunset|dusk|dawn)\b/i.test(heading) ? "sunset"
    : /\b(day|morning|afternoon)\b/i.test(heading) ? "day"
    : environment === "room" ? "indoor" : "day";
  const notes = ["Local fallback used. Connect Gemini for deeper script understanding and spatial staging."];
  if (headings.length > 1) notes.push("Multiple scenes found. Only the first scene is shown.");
  if (!headings.length) notes.push("No INT./EXT. scene heading found. Setting was inferred from action text.");
  for (const match of action.join("\n").matchAll(/\b([A-Z][a-z]+|[A-Z]{2,})\s+(?:stands?|walks?|sits?|waits?|runs?|enters?|looks?|opens?|turns?)\b/g)) {
    if (!/^(?:The|A|An|He|She|They|It|Someone)$/i.test(match[1])) names.add(match[1]);
  }
  const uniqueNames = [...new Map([...names].map((name) => [name.toLowerCase(), name])).values()];
  const rawObjects: Record<string, unknown>[] = [];
  function countObjects(noun: string) {
    let count = 0;
    const pattern = new RegExp(`\\b(?:(a|an|one|two|three|four|five|six|seven|eight|\\d+)\\s+)?(${noun})(s)?\\b`, "gi");
    for (const match of text.matchAll(pattern)) {
      const quantity = match[1]?.toLowerCase();
      count = Math.max(count, quantity ? counts[quantity] ?? Number(quantity) : match[3] ? 2 : 1);
    }
    return Math.min(count, 8);
  }
  for (const kind of ["car", "table", "chair", "tree", "bed", "sofa", "lamp", "door", "window", "rock"] as const) {
    for (let i = 0; i < countObjects(kind); i++) rawObjects.push({ kind, name: `${kind} ${i + 1}` });
  }
  const genericPeople = countObjects("person|character|man|woman") || (/\b(people|men|women)\b/i.test(text) ? 2 : 0);
  for (let i = 0; i < Math.min(Math.max(uniqueNames.length, genericPeople), 8); i++) rawObjects.push({ kind: "person", name: uniqueNames[i] ?? `Character ${i + 1}` });
  if (!rawObjects.length) notes.push("No supported objects were detected by the local fallback.");
  return normalizeSceneDescription({ title: heading, environment, road: environment !== "room" && /\b(road|highway|street)\b/i.test(text), lighting, objects: rawObjects, notes });
}
