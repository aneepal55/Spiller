"use client";

import { useEffect, useState } from "react";

const sample = `EXT. DESERT HIGHWAY | SUNSET\n\nMara stands alone beside a stalled car. Heat shimmers above the asphalt. In the distance, a motorcycle crests the hill and races toward her.`;

export function SceneDemo() {
  const [script, setScript] = useState(sample);
  const [status, setStatus] = useState<"ready" | "building" | "done">("ready");

  useEffect(() => {
    if (status !== "building") return;
    const timer = window.setTimeout(() => setStatus("done"), 2200);
    return () => window.clearTimeout(timer);
  }, [status]);

  return (
    <div className="demo-panel">
      <div className="script-entry">
        <div className="input-label"><span>Screenplay</span><span>{script.length} characters</span></div>
        <textarea value={script} onChange={(event) => { setScript(event.target.value); setStatus("ready"); }} aria-label="Screenplay scene" />
        <div className="demo-options">
          <label>Look <select aria-label="Visual style"><option>Cinematic realism</option><option>Graphic storyboard</option><option>Neo-noir</option></select></label>
          <button className="button generate-button" type="button" disabled={!script.trim() || status === "building"} onClick={() => setStatus("building")}>
            {status === "building" ? "Building scene…" : status === "done" ? "Scene ready ✓" : "Generate scene →"}
          </button>
        </div>
      </div>
      <div className={`demo-output ${status}`} aria-live="polite">
        <div className="output-grid" />
        <div className="output-object object-car" />
        <div className="output-object object-person" />
        <div className="output-camera">CAM 01</div>
        {status === "ready" && <p><span>3D</span> Your generated scene will appear here</p>}
        {status === "building" && <div className="build-state"><i /><strong>Directing your scene</strong><small>Blocking actors and placing cameras…</small></div>}
        {status === "done" && <div className="done-state"><span>Interactive preview ready</span><strong>EXT. Desert Highway</strong><small>3 cameras · 4 lights · 2 characters</small></div>}
      </div>
    </div>
  );
}
