"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SceneDemo.module.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildScene, cameraShots, shotsForScene, disposeScene, type Shot } from "./scene/desert-scene";

import { MAX_SCRIPT_LENGTH, normalizeSceneDescription, parseScreenplay, samples } from "./scene/screenplay";

type Viewer = { shot: (shot: Shot) => void; zoom: (factor: number) => void };

export function SceneDemo() {
  const [script, setScript] = useState<string>(samples.highway);
  const [description, setDescription] = useState(() => parseScreenplay(samples.highway));
  const [generatedScript, setGeneratedScript] = useState<string>(samples.highway);
  const [inputError, setInputError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [model, setModel] = useState("gemini-3.7-flash");
  const [source, setSource] = useState<"gemini" | "local">("local");
  const container = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [status, setStatus] = useState("Loading 3D preview…");
  const [ready, setReady] = useState(false);
  const [activeShot, setActiveShot] = useState<Shot | null>("wide");

  useEffect(() => {
    let active = true;
    fetch("/api/generate-scene")
      .then(async (response) => response.json() as Promise<{ configured?: boolean; model?: string }>)
      .then((data) => {
        if (!active) return;
        setAiConfigured(Boolean(data.configured));
        if (data.model) setModel(data.model);
      })
      .catch(() => { if (active) setAiConfigured(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
    } catch {
      const frame = requestAnimationFrame(() => setStatus("3D preview needs WebGL 2. Try a browser with hardware acceleration enabled."));
      return () => cancelAnimationFrame(frame);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-label", `3D preview of ${description.title}, with ${description.objects.length} objects`);
    renderer.domElement.setAttribute("role", "img");
    host.appendChild(renderer.domElement);
    const scene = buildScene(description);
    const shots = shotsForScene(description);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 250);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 2;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2 - 0.025;
    controls.enablePan = false;
    const render = () => renderer.render(scene, camera);
    const shot = (key: Shot) => {
      const preset = shots[key];
      camera.position.fromArray(preset.position);
      controls.target.fromArray(preset.target);
      controls.update();
      render();
    };
    const zoom = (factor: number) => {
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset);
      controls.update();
    };
    viewer.current = { shot, zoom };
    controls.addEventListener("change", render);
    const freeOrbit = () => setActiveShot(null);
    controls.addEventListener("start", freeOrbit);
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    shot("wide");
    resize();
    const firstFrame = requestAnimationFrame(() => {
      render();
      setReady(true);
      setStatus("Preview ready. Drag to orbit; scroll or pinch to zoom.");
    });
    const lost = (event: Event) => {
      event.preventDefault();
      setReady(false);
      setStatus("The 3D display was interrupted. Reload this page to restore the preview.");
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(firstFrame);
      observer.disconnect();
      controls.removeEventListener("change", render);
      controls.removeEventListener("start", freeOrbit);
      controls.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      disposeScene(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      viewer.current = null;
    };
  }, [description]);

  function applyScene(next: ReturnType<typeof parseScreenplay>, nextSource: "gemini" | "local") {
    setReady(false);
    setStatus("Building your 3D scene…");
    setDescription(next);
    setGeneratedScript(script);
    setSource(nextSource);
    setActiveShot("wide");
    setInputError("");
  }

  function generateLocally() {
    try {
      applyScene(parseScreenplay(script), "local");
    } catch (error) {
      setInputError(error instanceof Error ? error.message : "Unable to read this scene.");
    }
  }

  async function generateWithGemini() {
    if (!script.trim() || script.length > MAX_SCRIPT_LENGTH || isGenerating) return;
    setIsGenerating(true);
    setInputError("");
    setStatus("Gemini is reading your screenplay and staging the scene…");
    try {
      const response = await fetch("/api/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenplay: script }),
      });
      const data = await response.json() as { scene?: unknown; error?: string };
      if (!response.ok || !data.scene) throw new Error(data.error || "Gemini could not generate this scene.");
      applyScene(normalizeSceneDescription(data.scene), "gemini");
    } catch (error) {
      setStatus("The current preview is still available.");
      setInputError(error instanceof Error ? error.message : "Gemini could not generate this scene.");
    } finally {
      setIsGenerating(false);
    }
  }

  function selectShot(shot: Shot) {
    viewer.current?.shot(shot);
    setActiveShot(shot);
  }

  return (
    <div className={styles["scene-workspace"]}>
      <aside className={styles["sample-script"]}>
        <span className={styles["eyebrow"]}>01 / YOUR SCRIPT</span>
        <h2>Write the scene.</h2>
        <p className={styles["panel-description"]}>Paste a short scene. A Gemini agent will identify the setting, characters, props, and staging.</p>
        <div className={styles["script-samples"]} role="group" aria-label="Sample scripts">
          {Object.entries(samples).map(([key, text]) => <button type="button" key={key} aria-pressed={script === text} onClick={() => { setScript(text); setInputError(""); }}>{key === "highway" ? "Highway" : key === "room" ? "Interior" : "Park"}</button>)}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); void generateWithGemini(); }}>
          <div className={styles["editor-heading"]}><label className={styles["script-input-label"]} htmlFor="screenplay">Your screenplay</label><span id="script-count">{script.length.toLocaleString()} / {MAX_SCRIPT_LENGTH.toLocaleString()}</span></div>
          <textarea id="screenplay" className={styles["screenplay-input"]} value={script} onChange={(event) => { setScript(event.target.value); setInputError(""); }} aria-describedby="script-help script-count" aria-invalid={!!inputError} />

          <p id="script-help" className={styles["sample-note"]}>For the best result, paste one scene with an INT./EXT. heading and clear action lines.</p>
          <div className={styles["ai-status"]} data-configured={aiConfigured === true}>
            <span className={styles["status-dot"]} />
            <div><strong>{aiConfigured === null ? "Checking agent…" : aiConfigured ? "Gemini agent connected" : "Gemini agent needs an API key"}</strong><small>{aiConfigured ? `${model} · Google Cloud Agent Builder (ADK) · local runtime` : "Add GEMINI_API_KEY to .env.local, then restart"}</small></div>
          </div>
          {aiConfigured === false && <a className={styles["setup-link"]} href="https://aistudio.google.com/api-keys" target="_blank" rel="noreferrer">Create a free Gemini API key <span aria-hidden="true">↗</span></a>}
          <button className={[styles["button"], styles["generate-button"]].join(" ")} type="submit" disabled={!aiConfigured || !script.trim() || script.length > MAX_SCRIPT_LENGTH || isGenerating}>{isGenerating ? "Gemini agent is directing…" : "Generate with Gemini agent"}</button>
          <button className={styles["fallback-button"]} type="button" onClick={generateLocally} disabled={!script.trim() || script.length > MAX_SCRIPT_LENGTH || isGenerating}>Use basic local generator</button>
          {script.length > MAX_SCRIPT_LENGTH && <p role="alert" className={styles["input-error"]}>Shorten your script to {MAX_SCRIPT_LENGTH.toLocaleString()} characters.</p>}
          {inputError && <p role="alert" className={styles["input-error"]}>{inputError}</p>}
        </form>
        {script !== generatedScript && <p className={styles["sample-note"]} role="status">Script changed. Generate again to update the preview.</p>}
        <p className={styles["local-note"]}>{aiConfigured ? "Google ADK runs locally and sends this scene to Gemini." : "No billing is needed. Use a Google AI Studio project marked Free and do not connect a billing account."}</p>
      </aside>
      <section className={styles["viewer-panel"]} aria-label="Interactive scene preview">
        <div className={styles["viewer-heading"]}><div><span className={styles["eyebrow"]}>02 / YOUR PREVIEW</span><h2>Explore the scene.</h2></div><span className={styles["preview-badge"]}>{script !== generatedScript ? "Changes pending" : source === "gemini" ? "Gemini generated" : "Local preview"}</span></div>
        <div className={styles["scene-caption"]}>{description.title}</div>
        <div className={styles["three-viewport"]} ref={container} />
        <p className={styles["viewer-status"]} role="status">{status}</p>
        <div className={styles["viewer-toolbar"]}>
          <div className={styles["shot-controls"]} role="group" aria-label="Camera viewpoints">
            {(Object.keys(cameraShots) as Shot[]).map((shot) => (
              <button key={shot} type="button" disabled={!ready} aria-pressed={activeShot === shot} onClick={() => selectShot(shot)}>{cameraShots[shot].label}</button>
            ))}
          </div>
          <div className={styles["zoom-controls"]} role="group" aria-label="Preview controls">
            <button type="button" disabled={!ready} aria-label="Zoom in" onClick={() => viewer.current?.zoom(0.8)}>+</button>
            <button type="button" disabled={!ready} aria-label="Zoom out" onClick={() => viewer.current?.zoom(1.25)}>−</button>
            <button type="button" disabled={!ready} onClick={() => selectShot("wide")}>Reset view</button>
          </div>
        </div>
        <div className={styles["scene-summary"]}>
          <div className={styles["summary-heading"]}><h3>Detected in this scene</h3><span>{description.objects.length} objects · {description.lighting}</span></div>
          {!description.objects.length && <p>No supported objects found. Add a character action or a supported prop to your script.</p>}
          <ul className={styles["detected-objects"]}>{description.objects.map((object) => <li key={object.id}>{object.name} <small>({object.kind})</small></li>)}</ul>
          <details><summary>How this preview was interpreted</summary><p>{source === "gemini" ? "A Google ADK agent used Gemini to interpret the script; Three.js rendered its validated scene plan." : "The basic local fallback used keyword matching and automatic placement."}</p><ul>{description.notes.map((note) => <li key={note}>{note}</li>)}</ul></details>
        </div>
      </section>
    </div>
  );
}
