# Spacial Stage

A small framework-neutral motion grammar for spatial interfaces.

This repository is intentionally a terminology lab as well as a library. The demo lets you combine object role, transition, attachment, coordination, depth and direction, then play the resulting motion.

> The repository name is `spacial-stage` as requested. The interaction pattern itself is described in the UI as a “spatial stage”.

## Goals

- Describe motion semantically instead of scattering animation code through applications.
- Keep routing/application state separate from presentation.
- Compose useful behaviours: shared objects, panels, push/reveal/collapse, dock/float, swap/stagger/follow.
- Make reduced motion a first-class outcome.
- Always leave a Custom escape hatch.
- Prove the vocabulary interactively before freezing a public API.

## Taxonomy under test

| Axis | Current terms | Note |
| --- | --- | --- |
| Object role | Shared, Panel, Content, Collection, Custom | What kind of thing is moving? |
| Transition | Push, Reveal, Slide, Collapse, Custom | What happens to its presence/space? |
| Attachment | Free, Float, Dock, Pin, Custom | How is it attached to layout? |
| Coordination | None, Swap, Stagger, Follow, Custom | How does it relate to other objects? |
| Depth | Background, Focus, Foreground, Custom | Focus currently lives here rather than under Transition. |
| Direction | Auto, Top, Right, Bottom, Left, Custom | Which edge/vector participates? |

The playground is deliberately opinionated but not final. If a term feels wrong while using it, that is useful evidence.

## Run locally

```bash
npm install
npm run dev
```

## Library

The framework-neutral primitives live in `src/spacial-stage.js`. The demo imports the same module consumers would use.

