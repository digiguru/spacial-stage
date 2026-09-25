# Spacial Stage

A small framework-neutral motion grammar for spatial interfaces.

**Live playground:** https://spacial-stage-ochre.vercel.app/

This repository is intentionally a terminology lab as well as a library. The demo lets you combine independent motion axes, play the result, then override the defaults.

> The repository name is `spacial-stage` as requested. The interaction pattern itself is described in the UI as a “spatial stage”.

## Goals

- Describe motion semantically instead of scattering animation code through applications.
- Keep routing/application state separate from presentation.
- Compose shared objects, panels, layout displacement, depth, docking and coordinated motion.
- Make reduced motion a first-class outcome.
- Always leave a Custom escape hatch.
- Prove the vocabulary interactively before freezing the public API.

## Taxonomy under test

| Axis | Current terms | Question |
| --- | --- | --- |
| Object role | Shared, Panel, Content, Collection, Custom | What kind of thing is moving? |
| Transition | Slide, Reveal, Fade, Collapse, Custom | How does the object itself appear/move? |
| Layout effect | Overlay, Push, Replace, Reflow, Custom | What happens to neighbouring layout? |
| Attachment | Free, Float, Dock, Pin, Custom | How is it attached to the stage/layout? |
| Coordination | None, Swap, Stagger, Follow, Custom | How does it relate to other moving objects? |
| Depth | Background, Focus, Foreground, Custom | Where does it sit perceptually? |
| Direction | Auto, Top, Right, Bottom, Left, Custom | Which edge/vector participates? |

The important split is that **Push is a layout effect** and **Focus is depth**. They can therefore compose with transitions:

```
Panel + Reveal + Push + Dock + None + Foreground + Left
Shared + Slide + Overlay + Free + Follow + Focus + Right
```

The playground is deliberately opinionated but not final. If a term feels wrong while using it, that is useful evidence.

## Custom is always available

Every semantic axis includes Custom. Fine-grained overrides are always available for:

- distance
- duration
- stagger interval
- blur
- scale
- opacity
- easing
- arbitrary X/Y direction vector

Presets should make common motion easy; they must not make uncommon motion impossible.

## Run locally

```bash
npm install
npm run dev
```

## Library

The framework-neutral primitives live in `src/spacial-stage.js`. The demo imports the same module consumers would use.

```js
import { playMotion } from "@digiguru/spacial-stage";

await playMotion({
  targets: panel,
  layoutTargets: mainStage,
  container: stage,
  spec: {
    role: "panel",
    transition: "reveal",
    layout: "push",
    attachment: "dock",
    coordination: "none",
    depth: "foreground",
    direction: "left"
  }
});
```

The package metadata is ready for consumption, but no npm publication decision has been made yet.
