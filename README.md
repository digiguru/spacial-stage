# Spacial Stage

A small framework-neutral motion grammar for spatial interfaces.

**Live playground:** https://spacial-stage.vercel.app/

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

The destination belongs to the state. **Transition** describes how the object itself arrives there. **Layout effect** describes what that arrival does to neighbouring layout.

## Playground objects

The demo intentionally uses four different kinds of UI object:

- a shared SVG visual;
- an edge panel;
- a title + paragraph content block;
- a collection of floating cards.

Each can be clicked directly on the stage or selected from the object toolbar and configured independently for the active state.

The selected object is outlined by a separate presentation-layer overlay, so selection chrome stays sharp and visible even when the object itself is blurred, faded or sent into the background.

## Taxonomy under test

| Axis | Current terms | Question it answers |
| --- | --- | --- |
| Object role | Shared, Panel, Content, Collection | What kind of thing is this? |
| Transition | Slide, Reveal, Fade, Collapse, Custom | How does the object itself arrive? |
| Layout effect | Overlay, Push, Replace, Reflow, Custom | What happens to neighbouring layout? |
| Attachment | Free, Float, Dock, Pin, Custom | Where does the destination belong relative to layout? |
| Coordination | None, Swap, Stagger, Follow, Custom | How does its timing relate to other moving objects? |
| Depth | Background, Focus, Foreground, Custom | Where does it sit perceptually? |
| Direction / edge | Auto, Top, Right, Bottom, Left, Custom | Which vector or edge participates? |

The split between **Transition** and **Layout effect** is intentional:

```
Panel + Reveal + Push + Dock + Foreground + Left
Shared + Slide + Overlay + Free + Background + Right
```

These names are not considered final. The playground exists specifically to expose where the taxonomy feels awkward.

## Position authoring

Position is part of each object's destination state rather than an ad-hoc transform.

Each object stores:

- horizontal anchor: Left / Centre / Right;
- vertical anchor: Top / Centre / Bottom;
- offset units: Pixels / Percent;
- X/Y offset from that anchor.

Objects can be dragged directly on the stage. Dragging converts the visual destination back into the selected coordinate system, so percentage positioning stays percentage-based rather than silently becoming pixels.

Changing anchor or unit mode preserves the visual position and recalculates the stored offsets.

## Edit-to-replay authoring loop

Changing any motion parameter replays **only the selected object** from the previously selected named state into the current state using the newly edited configuration.

That makes the playground useful for riffing on individual parameters: adjust Reveal vs Fade, change depth, alter docking, tweak duration or edit a position and immediately see how that object reaches its destination.

The full-state Replay button still animates every object together.

## Custom is always available

Every object/state also exposes numeric and raw-CSS escape hatches:

- anchored X/Y destination offsets;
- horizontal/vertical anchor and pixel/percentage position mode;
- custom X/Y direction vector;
- travel distance;
- duration;
- stagger interval;
- blur;
- scale;
- opacity;
- easing;
- custom CSS declarations.

The semantic API should make common motion easy without making uncommon motion impossible.

## Generated CSS

For the selected object and state the playground shows two views.

### Element CSS

This contains:

- every semantic parameter as CSS custom properties;
- the destination transform;
- depth-derived blur, opacity and scale;
- z-index;
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
- Keep Transition separate from Layout effect.
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
