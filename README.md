# Spacial Stage

A small framework-neutral motion grammar for spatial interfaces.

**Live playground:** https://spacial-stage.vercel.app/

**Focused demos:** https://spacial-stage.vercel.app/demos/

The project is deliberately both **library** and **terminology lab**. The playground lets you author named UI states, select individual objects, configure how each object behaves in each state, switch between states, and inspect the concrete CSS implied by the semantic choices.

> The repository name is `spacial-stage` as requested. The interaction pattern itself is described in the UI as a “spatial stage”.

## State model

Spacial Stage does not model an object as merely “in” or “out”.

Instead, an application defines named states such as:

```
Home
Room
Cloud
```

Each state stores a complete destination configuration for every stage object.

For example, the same shared SVG can be:

- background + offset on **Home**;
- focused + centred in **Room**;
- background + left-weighted in **Cloud**.

The destination belongs to the state. **Animations** are zero or more effects describing how the object arrives there. **Layout effect** describes what that arrival does to neighbouring layout.

## Playground objects

The demo intentionally uses four different kinds of UI object:

- a shared SVG visual;
- an edge panel;
- a title + paragraph content block;
- a collection of floating cards.

Each can be clicked directly on the stage or selected from the object toolbar and configured independently for the active state. Clicking empty stage space, pressing Escape, or clicking the active object tab again clears selection so the full animation can be previewed without authoring chrome.

The selected object is outlined by a separate presentation-layer overlay, so selection chrome stays sharp and visible even when the object itself is blurred, faded or sent into the background.

## Taxonomy under test

| Axis | Current terms | Question it answers |
| --- | --- | --- |
| Object role | Shared, Panel, Content, Collection | What kind of thing is this? |
| Animations | Slide, Fade, Reveal, Focus, Collapse (0..many) | Which effects compose while the object arrives? |
| Layout effect | Overlay, Push, Replace, Reflow, Custom | What happens to neighbouring layout? |
| Attachment | Free, Float, Dock, Pin, Custom | Where does the destination belong relative to layout? |
| Coordination | None, Swap, Stagger, Follow, Custom | How does its timing relate to other moving objects? |
| Depth | Blur, Focus | Should the destination be softened/recessed or visually sharp? |
| Z-index | Integer | What explicit stacking order should the destination use? |
| Direction / edge | Auto, Top, Right, Bottom, Left, Custom | Which vector or edge participates? |

The split between **Animations** and **Layout effect** is intentional:

```
Panel + [Slide, Fade] + Push + Dock + Focus + z20 + Left
Shared + [Slide, Focus] + Overlay + Free + Blur + z1 + Right
Content + [] + Overlay + Free + Focus + z10 + Top
```

An empty animation list means the object snaps directly to its new destination. Effects compose independently:

- **Slide** interpolates destination position, size, rotation and 3D transform from the previous state.
- **Fade** arrives from transparent.
- **Reveal** opens a directional clip/mask.
- **Focus** resolves from extra blur and a softer scale into the destination appearance.
- **Collapse** expands from a compressed directional edge.

**Focus** is intentionally used in two related places now: Focus animation means “resolve from extra softness into the destination”, while Focus depth means “the destination itself is sharp”. That allows combinations such as Focus animation + Blur depth.

These names are not considered final. The playground exists specifically to expose where the taxonomy feels awkward.

## Depth: Blur vs Focus

Depth is now intentionally narrow. It controls only the destination's visual softness:

- **Blur** — stronger blur, reduced saturation/softening and lower opacity.
- **Focus** — sharp, fully saturated and full-opacity.

Depth does **not** control scale or stacking order.

Scale remains an explicit numeric transform. Stacking is authored separately with **Z-index**.

Old saved presets migrate without losing their old stacking intent:

- Background → Blur + z-index 1
- Base → Focus + z-index 10
- Foreground → Focus + z-index 20

If one object's z-index differs across named states, the inspector shows a warning listing the values. This matters because changing z-index between states can change which object visually crosses above another during a transition.

## State naming and removal

State names are editable directly in the playground. **+ State** creates and selects a state named **New State** immediately; there is no naming dialog. The active state's name can then be typed directly in the inspector.

**− State** removes the active state immediately and selects the nearest remaining state. The final remaining state cannot be removed.

## How Push interacts with object animation

**Push is a layout companion effect, not an object animation.**

For the panel example:

1. The panel itself follows its selected object animations such as Slide + Fade.
2. Because the panel's Layout effect is Push, the shared `stageContent` container is animated in the opposite direction to the panel's Direction.
3. The panel lives outside that shared content container, so it is not pushed along with the content it is displacing.
4. The shared content returns to its normal position by the end of the transition.

The current playground therefore treats Push as a temporary "make room while this arrives" gesture, not persistent reflow.

Layout effects are currently coordinated globally per state transition. If several objects request non-Overlay layout effects at once, the playground prefers the panel's layout effect; if there is no panel candidate, it uses the first non-Overlay request. Individual object animations still run independently.

## Placement transitions

**Placement is now a first-class framework concern.** Consumers describe where an object belongs; Spacial Stage asks the browser where that destination really is and owns the transition between layout systems.

`createPlacementController(element, options)` supports named placements such as:

```js
const placement = createPlacementController(svg, {
  initial: "background",
  placements: {
    background: {
      type: "absolute",
      container: stage,
      sizeFrom: "inline",
      scale: 3,
      anchorX: "left",
      anchorY: "top",
      offsetX: { value: -0.38, relativeTo: "self" },
      rotateZ: -90
    },
    inline: {
      type: "flow",
      slot,
      align: "center",
      collapsedHeight: 24,
      gapBefore: 24,
      gapAfter: 24,
      style: {
        width: "clamp(220px, 62%, 360px)",
        aspectRatio: "1 / 1"
      }
    }
  }
});

await placement.transition("inline");
```

The framework:

1. materialises a hidden clone in the flow destination;
2. lets normal CSS/layout calculate its actual rectangle;
3. measures the destination and required flow height;
4. derives referenced absolute placements from that browser-measured size;
5. commits the destination slot size immediately so the target geometry is stable;
6. remeasures the destination after responsive layout has settled;
7. FLIPs affected neighbouring elements from their old browser positions to their new positions, so surrounding content visibly moves apart without animating a guessed slot height;
8. FLIPs the real element between source and settled destination rectangles;
9. interpolates placement rotation;
10. reparents the real element only after the transition;
11. commits the destination as real absolute or normal-flow layout.

This is deliberately different from asking application code to reproduce flex/block layout mathematics. The application still owns design intent—such as “3× larger”, “62% of itself off the left edge”, “centred in this slot”, or “24px before/after”—but not DOM-coordinate calculations.

Low-level primitives remain available: `captureRect`, `captureLayoutRect`, `rectRelativeTo`, `resolveAbsolutePlacementRect`, `flipFrames`, `animateFlip`, and `animateFlowSpace`.

## Absolute ↔ flow transitions

A core framework use case is moving one persistent object between **absolute stage space** and **real document flow** while surrounding content makes room for it.

The focused Absolute → Flow demo now uses the placement controller directly and intentionally runs at 1800ms so the layout choreography is easy to inspect. It shows the shared SVG:

- absolutely positioned, blurred and recessed behind foreground text in State 1;
- tweened into a real slot between paragraph 1 and paragraph 2 in State 2;
- with paragraph 1 determining the destination top edge;
- with the SVG's measured rendered height determining how much flow space opens;
- with paragraph 2 moving through a browser-measured layout FLIP: the final document flow is committed first, then the paragraph visually glides from its old position to its new one.

The demo contains no hand-authored destination rectangle maths: its inline rectangle and slot height are browser-measured by the placement controller.

## Depth of field experiment

The **Depth of Field** demo explores spatial focus across a single tilted text plane.

CSS filters apply to whole elements, so a true continuously varying blur cannot be authored on one DOM element directly. The demo approximates per-depth focus by rendering the same surface into 28 narrow clipped strips. Each strip estimates its local Z-depth from the plane's Rotate Y angle and uses `resolveDepthOfField()` to calculate how much blur it should receive.

The model separates four controls:

- **Focal length / perspective** — camera perspective strength. In the DOM implementation this maps to CSS `perspective`; larger values produce a flatter, longer-lens look.
- **Focus plane** — the Z-depth that is perfectly sharp.
- **Focus area** — the depth range around that plane that remains fully sharp.
- **Aperture / blur strength** — a stylised maximum blur controlling how aggressively near/far depth falls out of focus.

The demo also exposes Near / Middle / Far focus states. Those are destination states: selecting one tweens the focal plane from its current value to the chosen depth.

The reusable `resolveDepthOfField()` helper is deliberately renderer-neutral. Today the demo applies it to clipped DOM slices; a future WebGL/shader renderer could use the same focus profile against a real per-pixel depth map.

## Focused demo pages

The playground remains the full authoring environment. The demos landing page is now a capability catalogue with focused examples for:

- Absolute → Flow and Absolute → Absolute placement;
- edge alignment and responsive placement;
- size and rotation;
- animation curves and speed;
- Blur vs Focus;
- composed animations and Reveal vs Collapse;
- padding vs margin;
- Stagger & Follow coordination;
- layout effects and depth/stacking;
- reduced-motion outcomes;
- 3D transforms, cube spin, parallax, classic Cover Flow and a sliced-surface Depth of Field experiment.

Discrete-state demos follow one interaction rule: **state buttons are destinations**. Clicking any state tweens from the currently completed state to that destination; clicking the active state is a no-op. If another state is clicked while a transition is running, it is queued and becomes the next destination. Replay controls are convenience sequences that reset to their documented source and then use the same state transition path.

Reduced Motion demonstrates the semantic rule explicitly: the full-motion and reduced-motion examples always occupy the same selected state. The full-motion object interpolates between states; the reduced-motion object commits the selected destination immediately. Continuous interaction demos such as pointer-driven Parallax remain continuous rather than inventing artificial named states.

Each focused demo also shows a **Markup required** reference underneath the visual example. Framework-backed demos show the minimal HTML plus Spacial Stage API setup; experimental browser-only demos show the raw HTML/CSS/WAAPI they currently rely on. The snippets are intentionally smaller than the demo source and include copy controls so the gallery doubles as living documentation.

This keeps the terminology testable one behaviour at a time while the playground demonstrates complete named states.

## Position authoring

Position is part of each object's destination state rather than an ad-hoc transform.

Each object stores:

- horizontal anchor: Left / Centre / Right;
- vertical anchor: Top / Centre / Bottom;
- offset units: Pixels / Percent;
- X/Y offset from that anchor.

Objects can be dragged directly on the stage. Dragging converts the visual destination back into the selected coordinate system, so percentage positioning stays percentage-based rather than silently becoming pixels.

Changing anchor or unit mode preserves the visual position and recalculates the stored offsets.

## Size authoring

Size is also part of the destination state and is deliberately separate from **Scale**.

Each object can use:

- Natural size — the object's authored/CSS dimensions;
- Pixels — explicit destination width and height;
- Percent — width as a percentage of stage width and height as a percentage of stage height.

The selection frame has a bottom-right resize handle. Dragging it edits destination width/height directly. If an object is still using Natural size, the first resize converts that state to Pixels. If it already uses Percent, resizing keeps percentage sizing.

Direct resize also adjusts the stored anchored position so the top-left visual corner remains stable while the bottom-right handle moves.

**Size = geometry. Scale = presentation transform.**

## Rotation authoring

Rotation is a destination-state property just like position and size.

Each object stores:

- **Rotate Z** — the normal 2D clockwise/counter-clockwise angle.

When **Slide** is selected, Rotate Z interpolates from the previous state's angle into the current state's angle. Without Slide, the object snaps to the new angle before any other selected effects such as Fade run.

The small rotation added by the Float attachment remains additive, so an authored Rotate Z value and Float can coexist.

## Local 3D transforms

Each object can also author a local 3D destination transform:

- **Rotate X** — pitch around the horizontal axis;
- **Rotate Y** — yaw around the vertical axis;
- **Translate Z** — move toward or away from the viewer;
- **Perspective** — camera distance controlling how strong the 3D distortion appears.

The generated transform is kept structurally consistent between states:

```css
perspective(...)
translate3d(x, y, z)
rotateX(...)
rotateY(...)
rotateZ(...)
scale(...)
```

That consistency lets the browser interpolate the transform smoothly when Slide is selected.

This first implementation is deliberately **single-object 3D**. It treats each stage object as one transformable plane and enables `transform-style: preserve-3d`, but it does not yet introduce a full layer hierarchy.

## Approaches for multiple 3D layers

There are four sensible ways to extend the model.

### 1. Single transformed object

**Implemented now.**

The whole object is one 3D plane.

Best for:

- cards;
- panels;
- posters/screens;
- simple tilt/parallax;
- rotating a whole component.

Advantages:

- simple state model;
- current selection/drag/resize logic still works;
- no hierarchy UI required.

Limit:

- everything inside the object remains effectively one authored plane.

### 2. Child layer stack

A stage object owns a set of named internal layers:

```
Card
├── background   z: -20
├── illustration z: 0
├── title        z: 18
└── badge        z: 35
```

The parent owns position/rotation/perspective; each child owns a local X/Y/Z offset.

Best for:

- parallax cards;
- device mock-ups;
- layered diagrams;
- visual depth without needing independent route/state objects.

Advantages:

- relatively compact UI;
- child layers inherit parent motion;
- easy to expose a “Layers” inspector.

Trade-off:

- layers are subordinate to the parent, so they are not fully independent stage objects.

### 3. 3D object group / scene graph

Introduce a Group object that can contain ordinary stage objects. The group owns shared transform/perspective, while children retain independent state, animation and X/Y/Z transforms.

```
Scene group
├── panel
├── shared SVG
├── title
└── cards
```

Best for:

- genuine spatial scenes;
- coordinated camera-like transitions;
- objects passing in front of/behind each other;
- reusable 3D compositions.

Advantages:

- most expressive model;
- hierarchy naturally supports nested transforms;
- works well with `transform-style: preserve-3d`.

Trade-offs:

- requires hierarchy selection;
- group vs child drag behaviour;
- inherited transforms;
- more complex bounding boxes and hit-testing;
- z-index and Translate Z interaction need very explicit rules.

### 4. Visual-only pseudo layers

Generate front/back/shadow/thickness faces from one object using pseudo-elements or internal generated wrappers.

Best for:

- adding thickness;
- card backs;
- simple extrusion;
- non-interactive decoration.

Advantages:

- cheap;
- almost no new authoring model.

Trade-off:

- generated faces are not independent or interactive.

### Suggested direction

The strongest next step is **Child layer stack first**, then promote to a full **Group / scene graph** only if real use cases demand independent nested stage objects.

That gives useful parallax and real Z separation without immediately forcing the entire authoring tool to become a 3D scene editor.

## Edit-to-replay authoring loop

Changing any motion parameter replays **only the selected object** from the previously selected named state into the current state using the newly edited configuration.

That makes the playground useful for riffing on individual parameters: toggle Slide/Fade/Reveal/Focus/Collapse independently, combine several, remove all of them, change depth, alter docking, tweak duration or edit a position and immediately see how that object reaches its destination.

The full-state Replay button still animates every object together.

## Custom is always available

Every object/state also exposes numeric and raw-CSS escape hatches:

- anchored X/Y destination offsets;
- horizontal/vertical anchor and pixel/percentage position mode;
- natural, pixel or percentage destination width/height;
- Rotate Z destination angle;
- Rotate X / Rotate Y / Translate Z / Perspective for local 3D;
- custom X/Y direction vector;
- travel distance;
- duration;
- stagger interval;
- blur;
- scale;
- opacity;
- explicit z-index;
- easing;
- custom CSS declarations.

The semantic API should make common motion easy without making uncommon motion impossible.

## Generated CSS

For the selected object and state the playground shows two views.

### Element CSS

This contains:

- every semantic parameter as CSS custom properties, including the composed animation list;
- destination width and height;
- the destination 2D/3D transform;
- depth-derived blur, softening and opacity;
- explicit scale and z-index;
- custom CSS appended after generated declarations.

### Parent / group CSS

This contains only the rules the selected behaviour requires from its context, including:

- positioned containing blocks for Dock;
- container displacement for Push;
- parent fade/replacement for Replace;
- parent scaling/reflow for Reflow;
- stagger/follow timing;
- swap-group requirements.

The purpose is to make every bit of vocabulary traceable to actual browser behaviour.

## Goals

- Describe motion semantically instead of scattering animation code through applications.
- Keep routing/application state separate from presentation.
- Treat named states as first-class concepts.
- Make shared-object continuity reusable across TeamTools-style applications.
- Keep composable Animations separate from Layout effect.
- Make reduced motion a first-class outcome.
- Always leave a Custom escape hatch.
- Prove the vocabulary interactively before freezing the public API.

## Run locally

```bash
npm install
npm run dev
```

## Library

The framework-neutral primitives live in `src/spacial-stage.js` and are exported from the package root.

```js
import {
  animateBetweenStates,
  cssForElement,
  cssForParent
} from "@digiguru/spacial-stage";
```

The package metadata is ready for consumption, but no npm publication decision has been made yet.
