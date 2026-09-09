import * as THREE from "three";
import type { SceneDescription } from "./screenplay";

export const cameraShots = {
  wide: { label: "Wide shot" },
  character: { label: "Closer view" },
  overhead: { label: "Overhead" },
};
export type Shot = keyof typeof cameraShots;

export function shotsForScene(description: SceneDescription) {
  const stagedObjects = description.objects.filter((o) => o.placement !== "background");
  const depth = Math.max(5, ...stagedObjects.map((o) => Math.max(Math.abs(o.position[0]), Math.abs(o.position[2])) + 3));
  const person = description.objects.find((o) => o.kind === "person") ?? description.objects[0];
  const target = person ? [person.position[0], 1, person.position[2]] : [0, 1, 0];
  return {
    wide: { label: "Wide shot", position: [depth + 8, depth + 6, depth + 12], target: [0, 1, 0] },
    character: { label: "Closer view", position: [target[0] + 5, 4, target[2] + 7], target },
    overhead: { label: "Overhead", position: [0, depth * 2 + 14, 0.1], target: [0, 0, 0] },
  };
}

// All geometry is created locally; no models, textures, or services are downloaded.
export function buildScene(description: SceneDescription) {
  const scene = new THREE.Scene();
  const sky = description.lighting === "night" ? "#182338"
    : description.lighting === "sunset" ? "#d9a477"
    : description.lighting === "indoor" ? "#5d564d" : "#aecbdb";
  scene.background = new THREE.Color(sky);
  scene.fog = new THREE.Fog(sky, 60, 150);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  function material(color: string) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
    return materials.get(color)!;
  }
  function mesh(geometry: THREE.BufferGeometry, color: string, x: number, y: number, z: number, parent: THREE.Object3D = scene) {
    const object = new THREE.Mesh(geometry, material(color));
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(w: number, h: number, d: number, color: string, x: number, y: number, z: number, parent: THREE.Object3D = scene) {
    return mesh(new THREE.BoxGeometry(w, h, d), color, x, y, z, parent);
  }
  const floorColor = {
    desert: "#bd9566", room: "#8e8275", park: "#75855c", street: "#77746d",
    forest: "#526047", beach: "#d2bd88", city: "#85817a", rooftop: "#77746d", open: "#a19f91",
  }[description.environment];
  if (description.environment === "rooftop") {
    box(20, 0.5, 16, floorColor, 0, -0.3, 0);
    const parapet = "#aaa49a";
    box(20, 0.9, 0.35, parapet, 0, 0.42, -8);
    box(20, 0.9, 0.35, parapet, 0, 0.42, 8);
    box(0.35, 0.9, 16, parapet, -10, 0.42, 0);
    box(0.35, 0.9, 16, parapet, 10, 0.42, 0);
    // Rooftop access and ventilation establish scale without relying on Gemini
    // to invent architectural blocks among the actors.
    box(3.2, 2.8, 3, "#686b66", 6.8, 1.35, -5.8);
    box(1, 0.65, 1, "#8b908b", -5.8, 0.3, 4.6);
    box(0.55, 0.9, 0.55, "#929792", -4.4, 0.42, 5.1);
    for (let i = 0; i < 14; i++) {
      const x = -28 + i * 4.2;
      const h = 5 + (i * 7 % 13);
      const z = -19 - (i % 3) * 4;
      box(3.1, h, 3.2, i % 2 ? "#454b4a" : "#555957", x, h / 2 - 3, z);
    }
  } else {
    box(220, 0.2, 220, floorColor, 0, -0.15, 0);
  }
  if (description.road) {
    box(6, 0.06, 220, "#414047", 0, 0, 0);
    for (const x of [-2.8, 2.8]) box(0.09, 0.015, 220, "#e4d6af", x, 0.04, 0);
    for (let z = -105; z < 110; z += 6) box(0.12, 0.015, 2.5, "#e4b94f", 0, 0.04, z);
  }
  if (description.environment === "room") {
    const depth = 18;
    box(18, 3.5, 0.2, "#c4b7a2", 0, 1.7, -9);
    box(0.2, 3.5, depth, "#ab9f8e", -9, 1.7, 0);
    box(0.2, 3.5, depth, "#b5aa99", 9, 1.7, 0);
  }
  const objectGroups = new Map<string, THREE.Group>();
  for (const item of description.objects) {
    const group = new THREE.Group();
    group.name = item.name;
    group.userData = { id: item.id, kind: item.kind };
    group.position.fromArray(item.position);
    group.rotation.y = item.rotationY;
    scene.add(group);
    objectGroups.set(item.id, group);
    if (item.kind === "car") buildCar(group, item.color);
    if (item.kind === "person") buildPerson(group, item.color);
    if (item.kind === "table") {
      box(2, 0.15, 1.3, item.color, 0, 0.9, 0, group);
      for (const x of [-0.8, 0.8]) for (const z of [-0.45, 0.45]) box(0.12, 0.85, 0.12, item.color, x, 0.4, z, group);
      group.scale.set(item.size[0] / 2, item.size[1] / 0.9, item.size[2] / 1.3);
    }
    if (item.kind === "chair") {
      box(0.6, 0.12, 0.6, item.color, 0, 0.5, 0, group);
      box(0.6, 0.7, 0.1, item.color, 0, 0.9, -0.25, group);
      for (const x of [-0.23, 0.23]) for (const z of [-0.23, 0.23]) box(0.08, 0.5, 0.08, item.color, x, 0.25, z, group);
      group.scale.set(item.size[0] / 0.7, item.size[1], item.size[2] / 0.7);
    }
    if (item.kind === "tree") {
      mesh(new THREE.CylinderGeometry(0.15, 0.25, 2, 8), "#73533b", 0, 1, 0, group);
      mesh(new THREE.ConeGeometry(1.1, 2.7, 8), item.color, 0, 2.7, 0, group);
      group.scale.set(item.size[0] / 2.2, item.size[1] / 4, item.size[2] / 2.2);
    }
    if (item.kind === "bed") {
      box(2, 0.45, 3.5, item.color, 0, 0.38, 0, group);
      box(2, 0.8, 0.18, "#6e513e", 0, 0.65, -1.66, group);
      box(1.6, 0.18, 0.65, "#eee2cc", 0, 0.68, -1.15, group);
      group.scale.set(item.size[0] / 2, item.size[1] / 0.7, item.size[2] / 3.5);
    }
    if (item.kind === "sofa") {
      box(2.6, 0.55, 0.9, item.color, 0, 0.45, 0, group);
      box(2.6, 0.75, 0.22, item.color, 0, 0.85, -0.38, group);
      for (const x of [-1.18, 1.18]) box(0.22, 0.65, 0.9, item.color, x, 0.62, 0, group);
      group.scale.set(item.size[0] / 2.6, item.size[1], item.size[2]);
    }
    if (item.kind === "lamp") {
      mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.8, 10), "#665544", 0, 0.9, 0, group);
      mesh(new THREE.ConeGeometry(0.42, 0.55, 16, 1, true), item.color, 0, 1.85, 0, group);
      group.scale.set(item.size[0] / 0.8, item.size[1] / 2.1, item.size[2] / 0.8);
    }
    if (item.kind === "door" || item.kind === "window" || item.kind === "building") {
      box(item.size[0], item.size[1], item.size[2], item.color, 0, item.size[1] / 2, 0, group);
    }
    if (item.kind === "board") {
      box(item.size[0] + 0.16, item.size[1] + 0.16, 0.09, "#8a6845", 0, 0, 0, group);
      box(item.size[0], item.size[1], 0.12, item.color, 0, 0, 0.06, group);
      // A few subtle chalk marks make the primitive immediately readable.
      for (const [x, y, width] of [[-1.3, 0.28, 1.15], [0.45, 0.28, 1.45], [-0.8, -0.18, 1.8]] as const) {
        box(width, 0.025, 0.018, "#ddd8c7", x, y, 0.13, group);
      }
    }
    if (item.kind === "balloon") {
      const balloon = mesh(new THREE.SphereGeometry(0.5, 24, 18), item.color, 0, 0, 0, group);
      balloon.scale.set(item.size[0], item.size[1], item.size[2]);
      mesh(new THREE.ConeGeometry(0.055, 0.12, 10), item.color, 0, -item.size[1] / 2 - 0.05, 0, group).rotation.z = Math.PI;
    }
    if (item.kind === "paper") {
      box(item.size[0], item.size[1], Math.max(0.015, item.size[2]), item.color, 0, item.placement === "floor" ? item.size[1] / 2 : 0, 0, group);
      box(item.size[0] * 0.62, 0.012, 0.018, "#6f6659", 0, item.placement === "floor" ? item.size[1] * 0.58 : 0, Math.max(0.02, item.size[2]), group);
    }
    if (item.kind === "railing") {
      box(item.size[0], 0.1, item.size[2], item.color, 0, item.size[1], 0, group);
      const posts = Math.max(2, Math.round(item.size[0] / 1.3));
      for (let i = 0; i < posts; i++) box(0.07, item.size[1], item.size[2], item.color, -item.size[0] / 2 + i * item.size[0] / (posts - 1), item.size[1] / 2, 0, group);
    }
    if (item.kind === "rock") {
      const rock = mesh(new THREE.DodecahedronGeometry(0.5), item.color, 0, item.size[1] / 2, 0, group);
      rock.scale.set(item.size[0], item.size[1], item.size[2]);
    }
    if (item.kind === "prop") {
      const label = `${item.name} ${item.description}`.toLowerCase();
      const centerY = item.placement === "floor" ? item.size[1] / 2 : 0;
      if (/\b(?:cup|mug)\b/.test(label)) {
        mesh(new THREE.CylinderGeometry(item.size[0] * 0.35, item.size[0] * 0.3, item.size[1], 20), item.color, 0, centerY, 0, group);
        const handle = mesh(new THREE.TorusGeometry(item.size[0] * 0.26, Math.max(0.025, item.size[0] * 0.06), 8, 18), item.color, item.size[0] * 0.38, centerY, 0, group);
        handle.rotation.y = Math.PI / 2;
      } else if (/\b(?:bottle|vase)\b/.test(label)) {
        mesh(new THREE.CylinderGeometry(item.size[0] * 0.32, item.size[0] * 0.42, item.size[1] * 0.75, 20), item.color, 0, centerY - item.size[1] * 0.1, 0, group);
        mesh(new THREE.CylinderGeometry(item.size[0] * 0.16, item.size[0] * 0.24, item.size[1] * 0.25, 20), item.color, 0, centerY + item.size[1] * 0.4, 0, group);
      } else if (/\bumbrella\b/.test(label)) {
        mesh(new THREE.CylinderGeometry(0.025, 0.025, item.size[1] * 0.72, 10), "#62584d", 0, centerY - item.size[1] * 0.12, 0, group);
        mesh(new THREE.ConeGeometry(item.size[0] / 2, item.size[1] * 0.3, 24, 1, true), item.color, 0, centerY + item.size[1] * 0.38, 0, group);
      } else {
        const geometry = item.shape === "sphere" ? new THREE.SphereGeometry(0.5, 18, 12)
          : item.shape === "cylinder" ? new THREE.CylinderGeometry(0.5, 0.5, 1, 16)
          : item.shape === "cone" ? new THREE.ConeGeometry(0.5, 1, 16)
          : new THREE.BoxGeometry(1, 1, 1);
        const prop = mesh(geometry, item.color, 0, centerY, 0, group);
        prop.scale.set(item.size[0], item.size[1], item.size[2]);
      }
    }
  }

  // A thin physical connector makes relationships such as a tag tied to a
  // balloon legible even when the model chooses slightly imperfect positions.
  for (const item of description.objects) {
    if (!item.attachedTo) continue;
    const child = objectGroups.get(item.id);
    const parent = objectGroups.get(item.attachedTo);
    if (!child || !parent) continue;
    const from = parent.position.clone();
    if (description.objects.find((object) => object.id === item.attachedTo)?.kind === "balloon") from.y -= 0.35;
    const to = child.position.clone();
    const length = from.distanceTo(to);
    if (length < 0.05 || length > 6) continue;
    const connector = mesh(new THREE.CylinderGeometry(0.012, 0.012, length, 7), "#d8cfb9", 0, 0, 0);
    connector.position.copy(from).add(to).multiplyScalar(0.5);
    connector.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
  }

  function buildCar(car: THREE.Group, color: string) {
    box(1.65, 0.6, 3.7, color, 0, 0.7, 0, car);
    box(1.4, 0.65, 1.85, "#394c53", 0, 1.29, -0.2, car);
    box(1.5, 0.1, 1.95, color, 0, 1.65, -0.2, car);
    box(1.7, 0.16, 0.13, "#bcb8aa", 0, 0.53, 1.88, car);
    box(1.7, 0.16, 0.13, "#bcb8aa", 0, 0.53, -1.88, car);
    for (const x of [-0.87, 0.87]) {
      for (const z of [-1.15, 1.15]) {
        const wheel = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.22, 16), "#242327", x, 0.37, z, car);
        wheel.rotation.z = Math.PI / 2;
      }
      box(0.33, 0.18, 0.05, "#f5dda0", x * 0.7, 0.8, 1.88, car);
    }
    const object = description.objects.find((item) => item.id === car.userData.id);
    if (object) car.scale.set(object.size[0] / 1.8, object.size[1] / 1.5, object.size[2] / 4);
  }

  function buildPerson(person: THREE.Group, color: string) {
    mesh(new THREE.SphereGeometry(0.19, 16, 12), "#bd8a64", 0, 1.63, 0, person);
    mesh(new THREE.CylinderGeometry(0.21, 0.17, 0.6, 8), color, 0, 1.12, 0, person);
    for (const x of [-0.11, 0.11]) {
      box(0.16, 0.73, 0.19, "#344349", x, 0.45, 0, person);
      box(0.18, 0.12, 0.32, "#302a27", x, 0.1, 0.05, person);
      const arm = box(0.13, 0.57, 0.14, "#bd8a64", x * 2.5, 1.09, 0, person);
      const object = description.objects.find((item) => item.id === person.userData.id);
      if (object?.pose === "reaching" && x > 0) {
        arm.position.set(0.3, 1.45, 0.08);
        arm.rotation.z = -1.05;
      } else {
        arm.rotation.z = x > 0 ? 0.12 : -0.12;
      }
    }
    const object = description.objects.find((item) => item.id === person.userData.id);
    if (object) {
      if (object.pose === "walking") {
        person.children[1].rotation.z = 0.08;
        person.children[2].rotation.x = 0.35;
        person.children[5].rotation.x = -0.35;
      }
      person.scale.set(object.size[0] / 0.7, object.size[1] / 1.8, object.size[2] / 0.7);
    }
  }

  // Deterministic scenery keeps camera comparisons consistent.
  if (description.environment === "desert") {
    for (let i = 0; i < 26; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (12 + (i * 17 % 55));
      const z = (i * 23 % 130) - 65;
      const hill = mesh(new THREE.ConeGeometry(7 + i % 8, 5 + i % 6, 5), "#a27a59", x, 1.2, z);
      hill.rotation.y = i;
    }
    for (let i = 0; i < 20; i++) {
      const x = (i % 2 ? -1 : 1) * (5 + i * 7 % 16);
      const rock = mesh(new THREE.DodecahedronGeometry(0.2 + i % 3 * 0.12), "#8e7958", x, 0.12, i * 11 % 60 - 30);
      rock.scale.y = 0.6;
    }
  }
  if (description.environment === "forest") {
    for (let i = 0; i < 24; i++) {
      const x = (i % 2 ? -1 : 1) * (8 + i * 5 % 22);
      const z = i * 13 % 70 - 35;
      mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.5, 8), "#59432f", x, 1.75, z);
      mesh(new THREE.ConeGeometry(1.4, 3.5, 9), "#38543a", x, 4.2, z);
    }
  }
  if (description.environment === "park") {
    for (let i = 0; i < 12; i++) {
      const x = (i % 2 ? -1 : 1) * (11 + i % 4 * 3.5);
      const z = i * 9 % 42 - 21;
      mesh(new THREE.CylinderGeometry(0.18, 0.25, 2.6, 9), "#66503a", x, 1.3, z);
      mesh(new THREE.SphereGeometry(1.15, 12, 9), "#4c6e49", x, 3.1, z);
    }
  }
  if (description.environment === "street" || description.environment === "city") {
    for (const side of [-1, 1]) for (let i = 0; i < 8; i++) {
      const height = 5 + (i * 5 % 9);
      box(5, height, 6, i % 2 ? "#777a77" : "#676b6c", side * 10.5, height / 2, i * 8 - 27);
    }
  }
  if (description.environment === "beach") {
    box(120, 0.08, 55, "#477f99", 0, -0.02, -55);
    for (let i = 0; i < 9; i++) box(9, 0.025, 0.12, "#d9e3dc", i * 14 - 56, 0.04, -27 - i % 2 * 1.5);
  }
  const night = description.lighting === "night";
  const indoor = description.lighting === "indoor";
  scene.add(new THREE.HemisphereLight(night ? "#94acd7" : indoor ? "#ffe1ae" : "#ffe1b2", "#675746", night ? 0.9 : indoor ? 1.5 : 2.4));
  const sun = new THREE.DirectionalLight(night ? "#a4bded" : indoor ? "#ffd49a" : "#ffd09a", night ? 1 : indoor ? 1.7 : 3);
  sun.position.set(-15, 12, -18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 65 });
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  return scene;
}

export function disposeScene(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    }
    if (object instanceof THREE.DirectionalLight) object.shadow.dispose();
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}
