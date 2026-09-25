import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPushFrames,
  buildTransitionFrames,
  motionMarkup,
  normaliseSpec,
  resolveDepth,
  resolveDirection
} from "../src/spacial-stage.js";

test("normalises numeric custom values", () => {
  const spec = normaliseSpec({
    distance: "240",
    duration: "900",
    customVector: { x: "3", y: "4" }
  });

  assert.equal(spec.distance, 240);
  assert.equal(spec.duration, 900);
  assert.deepEqual(spec.customVector, { x: 3, y: 4 });
});

test("uses role-specific automatic directions", () => {
  assert.deepEqual(resolveDirection({ role: "panel", direction: "auto" }), { x: -1, y: 0 });
  assert.deepEqual(resolveDirection({ role: "content", direction: "auto" }), { x: 0, y: 1 });
});

test("normalises custom direction vectors", () => {
  const vector = resolveDirection({
    direction: "custom",
    customVector: { x: 3, y: 4 }
  });

  assert.equal(vector.x, 0.6);
  assert.equal(vector.y, 0.8);
});

test("treats focus as depth rather than a transition", () => {
  const focus = resolveDepth({ depth: "focus" });
  const background = resolveDepth({ depth: "background" });

  assert.equal(focus.blur, 0);
  assert.equal(focus.opacity, 1);
  assert.ok(background.blur > focus.blur);
  assert.ok(background.opacity < focus.opacity);
});

test("reveal clips from the requested edge", () => {
  const [from, to] = buildTransitionFrames({
    transition: "reveal",
    direction: "left"
  });

  assert.equal(from.clipPath, "inset(0% 100% 0% 0%)");
  assert.equal(from.opacity, 0);
  assert.equal(to.clipPath, "inset(0% 0% 0% 0%)");
});

test("push moves surrounding content opposite the entering edge", () => {
  const [, to] = buildPushFrames({
    direction: "left",
    distance: 200
  });

  assert.match(to.transform, /translate3d\(88px, 0px, 0\)/);
});

test("creates declarative markup for every taxonomy axis", () => {
  const markup = motionMarkup({
    role: "panel",
    transition: "push",
    attachment: "dock",
    coordination: "follow",
    depth: "foreground",
    direction: "left"
  });

  assert.match(markup, /data-stage-role="panel"/);
  assert.match(markup, /data-stage-transition="push"/);
  assert.match(markup, /data-stage-attachment="dock"/);
  assert.match(markup, /data-stage-coordination="follow"/);
  assert.match(markup, /data-stage-depth="foreground"/);
  assert.match(markup, /data-stage-direction="left"/);
});
