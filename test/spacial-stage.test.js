import test from "node:test";
import assert from "node:assert/strict";

import {
  cssForElement,
  cssForParent,
  layoutCompanionFrames,
  normaliseSpec,
  positionValuesForCoordinates,
  resolveDepth,
  resolveDirection,
  resolvePosition,
  resolveSize,
  resolvedDirectionName,
  sizeValuesForDimensions
} from "../src/spacial-stage.js";

test("normalises named-state specs including anchored position and custom vector", () => {
  const spec = normaliseSpec({
    role: "shared",
    horizontalAnchor: "right",
    verticalAnchor: "bottom",
    positionMode: "percent",
    positionX: "-12.5",
    positionY: "7.25",
    sizeMode: "percent",
    sizeWidth: "42",
    sizeHeight: "31.5",
    duration: "900",
    scale: "1.2",
    customVector: { x: "3", y: "4" }
  });

  assert.equal(spec.horizontalAnchor, "right");
  assert.equal(spec.verticalAnchor, "bottom");
  assert.equal(spec.positionMode, "percent");
  assert.equal(spec.positionX, -12.5);
  assert.equal(spec.positionY, 7.25);
  assert.equal(spec.sizeMode, "percent");
  assert.equal(spec.sizeWidth, 42);
  assert.equal(spec.sizeHeight, 31.5);
  assert.equal(spec.duration, 900);
  assert.equal(spec.scale, 1.2);
  assert.deepEqual(spec.customVector, { x: 3, y: 4 });
});

test("legacy offsets migrate into absolute anchored position values", () => {
  const spec = normaliseSpec({
    offsetX: 120,
    offsetY: -40
  });

  assert.equal(spec.positionMode, "absolute");
  assert.equal(spec.positionX, 120);
  assert.equal(spec.positionY, -40);
});

test("auto and custom directions resolve independently from destination position", () => {
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
  const background = resolveDepth({
    depth: "background",
    transition: "reveal",
    layout: "push"
  });
  const focus = resolveDepth({
    depth: "focus",
    transition: "collapse",
    layout: "overlay"
  });

  assert.ok(background.blur > focus.blur);
  assert.ok(background.opacity < focus.opacity);
  assert.equal(focus.opacity, 1);
});

test("natural, absolute and percentage sizes resolve independently from scale", () => {
  const container = { clientWidth: 1000, clientHeight: 600 };
  const element = {
    offsetWidth: 240,
    offsetHeight: 120,
    dataset: {
      stageNaturalWidth: "240",
      stageNaturalHeight: "120"
    }
  };

  assert.deepEqual(
    resolveSize(element, container, { sizeMode: "natural", scale: 1.4 }),
    { width: 240, height: 120 }
  );

  assert.deepEqual(
    resolveSize(element, container, {
      sizeMode: "absolute",
      sizeWidth: 360,
      sizeHeight: 180,
      scale: 0.8
    }),
    { width: 360, height: 180 }
  );

  assert.deepEqual(
    resolveSize(element, container, {
      sizeMode: "percent",
      sizeWidth: 50,
      sizeHeight: 25
    }),
    { width: 500, height: 150 }
  );
});

test("resize dimensions round-trip through percentage size values", () => {
  const container = { clientWidth: 1000, clientHeight: 600 };
  const element = {
    offsetWidth: 200,
    offsetHeight: 100,
    dataset: {
      stageNaturalWidth: "200",
      stageNaturalHeight: "100"
    }
  };
  const spec = { sizeMode: "percent" };

  const values = sizeValuesForDimensions(
    element,
    container,
    spec,
    { width: 420, height: 210 }
  );

  assert.equal(values.sizeWidth, 42);
  assert.equal(values.sizeHeight, 35);
  assert.deepEqual(
    resolveSize(element, container, { ...spec, ...values }),
    { width: 420, height: 210 }
  );
});

test("center anchored absolute positioning resolves against the stage", () => {
  const container = { clientWidth: 1000, clientHeight: 600 };
  const element = {
    offsetWidth: 200,
    offsetHeight: 100,
    offsetLeft: 0,
    offsetTop: 0
  };

  const position = resolvePosition(element, container, {
    horizontalAnchor: "center",
    verticalAnchor: "center",
    positionMode: "absolute",
    positionX: 20,
    positionY: -10
  });

  assert.equal(position.x, 420);
  assert.equal(position.y, 240);
});

test("percentage positioning offsets from the selected anchor", () => {
  const container = { clientWidth: 1000, clientHeight: 600 };
  const element = {
    offsetWidth: 200,
    offsetHeight: 100,
    offsetLeft: 0,
    offsetTop: 0
  };

  const position = resolvePosition(element, container, {
    horizontalAnchor: "right",
    verticalAnchor: "bottom",
    positionMode: "percent",
    positionX: -10,
    positionY: -10
  });

  assert.equal(position.x, 700);
  assert.equal(position.y, 440);
});

test("drag coordinates round-trip through percentage anchor values", () => {
  const container = { clientWidth: 1000, clientHeight: 600 };
  const element = {
    offsetWidth: 200,
    offsetHeight: 100,
    offsetLeft: 30,
    offsetTop: 50
  };
  const spec = {
    horizontalAnchor: "center",
    verticalAnchor: "bottom",
    positionMode: "percent"
  };

  const values = positionValuesForCoordinates(
    element,
    container,
    spec,
    { left: 510, top: 410 }
  );

  const resolved = resolvePosition(
    element,
    container,
    { ...spec, ...values }
  );

  assert.ok(Math.abs((element.offsetLeft + resolved.x) - 510) < 0.001);
  assert.ok(Math.abs((element.offsetTop + resolved.y) - 410) < 0.001);
});

test("element CSS exposes every authored state axis including position", () => {
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
      horizontalAnchor: "left",
      verticalAnchor: "center",
      positionMode: "percent",
      positionX: -18,
      positionY: 7.5,
      sizeMode: "percent",
      sizeWidth: 44,
      sizeHeight: 36,
      distance: 320,
      duration: 840,
      stagger: 90
    }
  });

  assert.match(css, /data-stage-state="cloud"/);
  assert.match(css, /--stage-transition: slide/);
  assert.match(css, /--stage-layout: overlay/);
  assert.match(css, /--stage-attachment: free/);
  assert.match(css, /--stage-coordination: follow/);
  assert.match(css, /--stage-depth: background/);
  assert.match(css, /--stage-direction: left/);
  assert.match(css, /--stage-anchor-x: left/);
  assert.match(css, /--stage-anchor-y: center/);
  assert.match(css, /--stage-position-mode: percent/);
  assert.match(css, /--stage-position-x: -18%/);
  assert.match(css, /--stage-position-y: 7.5%/);
  assert.match(css, /--stage-size-mode: percent/);
  assert.match(css, /--stage-size-width: 44%/);
  assert.match(css, /--stage-size-height: 36%/);
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
  assert.match(css, /Anchored position is resolved against the stage/);
  assert.match(css, /Dock additionally snaps one axis/);
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
