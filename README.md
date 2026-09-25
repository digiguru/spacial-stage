# Spacial Stage

A small framework-neutral motion grammar for spatial interfaces.

The project is deliberately both **library** and **terminology lab**. The playground lets you author multiple named UI states, select individual objects, configure how each object behaves in each state, then switch between states and inspect the CSS the library would require.

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

For example, the same shared SVG might be:

- background + offset on **Home**;
- focused + centred in **Room**;
- background + left-weighted in **Cloud**.

The destination belongs to the state. The transition describes how the object arrives in that state from whatever state preceded it.

## Playground objects

The demo intentionally uses four different kinds of UI object:

- a shared SVG visual;
- an edge panel;
- a title + paragraph content block;
- a group of floating cards.

Each object can be selected independently and configured for the active state.

## Taxonomy under test

| Axis | Current terms | Question it answers |
| --- | --- | --- |
| Object role | Shared, Panel, Content, Collection | What kind of thing is this? |
| Transition | Slide, Push, Reveal, Collapse, Custom | How does it arrive in this state? |
| Attachment | Free, Float, Dock, Pin, Custom | Where does the destination belong relative to layout? |
| Coordination | None, Swap, Stagger, Follow, Custom | How does its movement relate to other objects? |
| Depth | Background, Focus, Foreground, Custom | Where does it sit perceptually? |
| Direction / edge | Auto, Top, Right, Bottom, Left, Custom | Which vector or edge participates? |

These names are not considered final. The playground exists specifically to expose where the taxonomy feels awkward.

## Custom is always available

Every object/state also exposes numeric and raw-CSS escape hatches:

- X/Y offsets;
- travel distance;
- duration;
- stagger interval;
- blur;
- scale;
- opacity;
- easing;
- custom CSS declarations.

The semantic API should make common motion easy without preventing a consumer from escaping it.

## Generated CSS

For the selected object and state the demo shows:

1. **Element CSS** — destination variables and computed visual rules.
2. **Parent / group CSS** — any containing-block, push, stagger, follow or swap rules required by the selected behaviour.

This is intentionally explicit so the semantic terminology can always be traced back to concrete browser behaviour.

## Goals

- Describe motion semantically instead of scattering animation code through applications.
- Keep routing/application state separate from presentation.
- Treat named states as first-class concepts.
- Make shared-object continuity reusable across different TeamTools-style applications.
- Make reduced motion a first-class outcome.
- Always leave a Custom escape hatch.
- Prove the vocabulary interactively before freezing a public API.

## Run locally

```bash
npm install
npm run dev
```

## Library

The framework-neutral primitives live in `src/spacial-stage.js`. The demo imports the same module consumers would use.
