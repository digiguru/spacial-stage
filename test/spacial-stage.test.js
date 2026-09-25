import test from "node:test";
import assert from "node:assert/strict";

import {
  cssForElement,
  cssForParent,
  layoutCompanionFrames,
  normaliseSpec,
  resolveDepth,
  resolveDirection,
  resolvedDirectionName
} from "../src/spacial-stage.js";

test("normalises named-state specs including offsets and custom vector", () => {
  const spec = normaliseSpec({
    role: "shared",
    offsetX: "240",
    offsetY: "-90",
    duration: "900",
    scale: "1.2",
    customVector: { x: "3", y: "4" }
  });

  assert.equal(spec.offsetX, 240);
  assert.equal(spec.offsetY, -90);
  assert.equal(spec.duration, 900);
  assert.equal(spec.scale, 1.2);
  assert.deepEqual(spec.customVector, { x: 3, y: 4 });
});

test("auto and custom directions resolve independently from destination offsets", () => {
  assert.deepEqual(resolveDirection({ role: "panel", direction: "auto" }), { x: -1, y: 0 });
  assert.equal(resolvedDirectionName({ role: "shared", direction: "auto" }), "right");

  const vector = resolveDirection({
    direction: "custom",
    customVector: { x: 3, y: 4 }
  });

  assert.equal(vector.x, 0.6);
  assert.equal(vector.y, 0.8);
});

test("depth remains a destination property independent of transition and layout", () => {
  const background = resolveDepth({ depth: "background", transition: "reveal", layout: "push" });
  const focus = resolveDepth({ depth: "focus", transition: "collapse", layout: "overlay" });

  assert.ok(background.blur > focus.blur);
  assert.ok(background.opacity < focus.opacity);
  assert.equal(focus.opacity, 1);
});

test("element CSS exposes every authored state axis", () => {
  const css = cssForElement({
    selector: '[data-object="svg"]',
    stateName: "cloud",
    spec: {
      role: "shared",
      transition: "slide",
      layout: "overlay",
      attachment: "free",
      coordination: "follow",
      depth: "background",
      direction: "left",
      distance: 320,
      duration: 840,
      stagger: 90,
      offsetX: -280,
      offsetY: 70
    }
  });

  assert.match(css, /data-stage-state="cloud"/);
  assert.match(css, /--stage-transition: slide/);
  assert.match(css, /--stage-layout: overlay/);
  assert.match(css, /--stage-attachment: free/);
  assert.match(css, /--stage-coordination: follow/);
  assert.match(css, /--stage-depth: background/);
  assert.match(css, /--stage-direction: left/);
  assert.match(css, /--stage-offset-x: -280px/);
});

test("parent CSS explains layout and coordination requirements", () => {
  const css = cssForParent({
    stageSelector: "[data-stage]",
    objectSelector: '[data-object="panel"]',
    spec: {
      role: "panel",
      transition: "reveal",
      layout: "push",
      attachment: "dock",
      coordination: "stagger",
      direction: "left",
      distance: 300,
      stagger: 80
    }
  });

  assert.match(css, /position: relative/);
  assert.match(css, /Dock requires a positioned containing block/);
  assert.match(css, /Layout effect: push/);
  assert.match(css, /--stage-layout-x/);
  assert.match(css, /transition-delay/);
});

test("layout effects are separate from object transition style", () => {
  assert.equal(layoutCompanionFrames({ layout: "overlay" }), null);

  const frames = layoutCompanionFrames({
    layout: "push",
    direction: "left",
    distance: 200
  });

  assert.equal(frames.length, 3);
  assert.match(frames[1].transform, /translate3d\(68px, 0px, 0\)/);
  assert.equal(frames.at(-1).transform, "translate3d(0px, 0px, 0)");
});

test("custom CSS remains an explicit escape hatch", () => {
  const css = cssForElement({
    spec: {
      customCss: "border-radius: 40px; mix-blend-mode: screen;"
    }
  });

  assert.match(css, /\/\* custom CSS \*\//);
  assert.match(css, /border-radius: 40px;/);
  assert.match(css, /mix-blend-mode: screen;/);
});
