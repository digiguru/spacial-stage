import {
  animateBetweenStates,
  applyFrame,
  captureNaturalSize,
  destinationFrame,
  normaliseSpec
} from "../spacial-stage.js";

const demo = document.body.dataset.demo;
const stage = document.querySelector("[data-lab-stage]");
const replay = document.querySelector("[data-replay]");

function nextFrame() {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
}

function clearAnimations(root = document) {
  root.querySelectorAll("*").forEach((element) => {
    element.getAnimations?.().forEach((animation) => animation.cancel());
  });
}

function runAnimation(element, frames, options = {}) {
  element.getAnimations?.().forEach((animation) => animation.cancel());
  return element.animate(frames, {
    duration: 1200,
    easing: "cubic-bezier(.2,.82,.24,1)",
    fill: "both",
    ...options
  });
}

function activate(button, selector) {
  document.querySelectorAll(selector).forEach((item) =>
    item.classList.toggle("is-active", item === button)
  );
}

function stageObject() {
  return document.querySelector("#labObject");
}

function prepareFrameworkObject(object) {
  if (!object || !stage) return;
  captureNaturalSize(object);
}

function createStateNavigator({
  initial,
  buttons,
  selector,
  apply,
  transition
}) {
  let current = initial;
  let running = false;
  let pending = null;

  function syncButtons(target = current) {
    const active = buttons.find(
      (button) => button.dataset.stateTarget === target
    );
    activate(active, selector);
    buttons.forEach((button) =>
      button.setAttribute("aria-pressed", String(button === active))
    );
  }

  async function go(next, { animate = true } = {}) {
    if (!next) return;

    if (running) {
      pending = next;
      return;
    }

    if (next === current) {
      syncButtons();
      return;
    }

    running = true;
    syncButtons(next);

    try {
      if (animate) {
        await transition(current, next);
      } else {
        await apply(next);
      }

      current = next;
    } finally {
      running = false;
      syncButtons();

      if (pending && pending !== current) {
        const queued = pending;
        pending = null;
        void go(queued);
      } else {
        pending = null;
      }
    }
  }

  function initialise() {
    apply(initial);
    syncButtons();
  }

  function reapply() {
    apply(current);
  }

  initialise();

  return {
    go,
    reapply,
    get current() {
      return current;
    },
    get running() {
      return running;
    }
  };
}

if (demo === "easing") {
  const rows = [...document.querySelectorAll("[data-easing]")];
  const buttons = [...document.querySelectorAll("[data-state-target]")];

  function transformFor(row, name) {
    const distance = Math.max(0, row.querySelector(".lab-track").clientWidth - 66);
    return name === "start" ? "translateX(0)" : `translateX(${distance}px)`;
  }

  const navigator = createStateNavigator({
    initial: "start",
    buttons,
    selector: "[data-state-target]",
    apply(name) {
      rows.forEach((row) => {
        row.querySelector(".lab-runner").style.transform = transformFor(row, name);
      });
    },
    async transition(from, to) {
      const animations = rows.map((row) => {
        const runner = row.querySelector(".lab-runner");
        const target = transformFor(row, to);
        runner.style.transform = target;

        return runAnimation(
          runner,
          [
            { transform: transformFor(row, from) },
            { transform: target }
          ],
          { duration: 1800, easing: row.dataset.easing }
        );
      });

      await Promise.all(
        animations.map(async (animation) => {
          try {
            await animation?.finished;
          } catch {}
        })
      );
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.stateTarget)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("start", { animate: false });
    await nextFrame();
    await navigator.go("end");
  });
}

if (demo === "speed") {
  const rows = [...document.querySelectorAll("[data-duration]")];
  const buttons = [...document.querySelectorAll("[data-state-target]")];

  function transformFor(row, name) {
    const distance = Math.max(0, row.querySelector(".lab-track").clientWidth - 66);
    return name === "start" ? "translateX(0)" : `translateX(${distance}px)`;
  }

  const navigator = createStateNavigator({
    initial: "start",
    buttons,
    selector: "[data-state-target]",
    apply(name) {
      rows.forEach((row) => {
        row.querySelector(".lab-runner").style.transform = transformFor(row, name);
      });
    },
    async transition(from, to) {
      const animations = rows.map((row) => {
        const runner = row.querySelector(".lab-runner");
        const target = transformFor(row, to);
        runner.style.transform = target;

        return runAnimation(
          runner,
          [
            { transform: transformFor(row, from) },
            { transform: target }
          ],
          {
            duration: Number(row.dataset.duration),
            easing: "cubic-bezier(.2,.82,.24,1)"
          }
        );
      });

      await Promise.all(
        animations.map(async (animation) => {
          try {
            await animation?.finished;
          } catch {}
        })
      );
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.stateTarget)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("start", { animate: false });
    await nextFrame();
    await navigator.go("end");
  });
}

if (demo === "blur-focus") {
  const blurred = document.querySelector("#blurredObject");
  const focused = document.querySelector("#focusedObject");
  const buttons = [...document.querySelectorAll("[data-state-target]")];

  const focusedStyle = {
    filter: "blur(0px) saturate(1)",
    opacity: "1",
    transform: "scale(1)"
  };
  const blurredStyle = {
    filter: "blur(16px) saturate(.78)",
    opacity: "0.32",
    transform: "scale(.96)"
  };

  const states = {
    one: {
      left: focusedStyle,
      right: blurredStyle
    },
    two: {
      left: blurredStyle,
      right: focusedStyle
    }
  };

  const navigator = createStateNavigator({
    initial: "one",
    buttons,
    selector: "[data-state-target]",
    apply(name) {
      Object.assign(blurred.style, states[name].left);
      Object.assign(focused.style, states[name].right);
    },
    async transition(from, to) {
      Object.assign(blurred.style, states[to].left);
      Object.assign(focused.style, states[to].right);

      const animations = [
        runAnimation(
          blurred,
          [states[from].left, states[to].left],
          { duration: 1600 }
        ),
        runAnimation(
          focused,
          [states[from].right, states[to].right],
          { duration: 1600 }
        )
      ];

      await Promise.all(
        animations.map(async (animation) => {
          try {
            await animation?.finished;
          } catch {}
        })
      );
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.stateTarget)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("one", { animate: false });
    await nextFrame();
    await navigator.go("two");
  });
}

if (demo === "size") {
  const object = stageObject();
  prepareFrameworkObject(object);
  const buttons = [...document.querySelectorAll("[data-state-target]")];

  const states = {
    small: normaliseSpec({
      animations: ["slide"],
      horizontalAnchor: "center",
      verticalAnchor: "center",
      sizeMode: "absolute",
      sizeWidth: 110,
      sizeHeight: 110,
      duration: 1500
    }),
    large: null
  };
  states.large = normaliseSpec({
    ...states.small,
    sizeWidth: 300,
    sizeHeight: 170
  });

  const navigator = createStateNavigator({
    initial: "small",
    buttons,
    selector: "[data-state-target]",
    apply(name) {
      applyFrame(object, destinationFrame(object, stage, states[name]));
    },
    transition(from, to) {
      return animateBetweenStates(object, stage, states[from], states[to]);
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.stateTarget)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("small", { animate: false });
    await nextFrame();
    await navigator.go("large");
  });
}

if (demo === "rotation") {
  const object = stageObject();
  prepareFrameworkObject(object);
  const buttons = [...document.querySelectorAll("[data-state-target]")];

  function spec(value) {
    return normaliseSpec({
      animations: ["slide"],
      horizontalAnchor: "center",
      verticalAnchor: "center",
      rotateZ: Number(value),
      duration: 1400
    });
  }

  const navigator = createStateNavigator({
    initial: "0",
    buttons,
    selector: "[data-state-target]",
    apply(name) {
      applyFrame(object, destinationFrame(object, stage, spec(name)));
    },
    transition(from, to) {
      return animateBetweenStates(object, stage, spec(from), spec(to));
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.stateTarget)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("-90", { animate: false });
    await nextFrame();
    await navigator.go("180");
  });
}

if (demo === "absolute-absolute") {
  const object = stageObject();
  prepareFrameworkObject(object);
  const buttons = [...document.querySelectorAll("[data-state-target]")];

  const states = {
    a: normaliseSpec({
      animations: ["slide"],
      horizontalAnchor: "left",
      verticalAnchor: "top",
      positionX: 28,
      positionY: 28,
      sizeMode: "absolute",
      sizeWidth: 120,
      sizeHeight: 120,
      rotateZ: -12,
      duration: 1800
    }),
    b: null
  };
  states.b = normaliseSpec({
    ...states.a,
    horizontalAnchor: "right",
    verticalAnchor: "bottom",
    positionX: -30,
    positionY: -30,
    sizeWidth: 180,
    sizeHeight: 110,
    rotateZ: 24
  });

  const navigator = createStateNavigator({
    initial: "a",
    buttons,
    selector: "[data-state-target]",
    apply(name) {
      applyFrame(object, destinationFrame(object, stage, states[name]));
    },
    transition(from, to) {
      return animateBetweenStates(object, stage, states[from], states[to]);
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.stateTarget)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("a", { animate: false });
    await nextFrame();
    await navigator.go("b");
  });
}

if (demo === "alignment") {
  const object = stageObject();
  prepareFrameworkObject(object);
  const buttons = [...document.querySelectorAll("[data-state-target]")];
  const placements = {
    top: { horizontalAnchor: "center", verticalAnchor: "top", positionX: 0, positionY: 28 },
    right: { horizontalAnchor: "right", verticalAnchor: "center", positionX: -28, positionY: 0 },
    bottom: { horizontalAnchor: "center", verticalAnchor: "bottom", positionX: 0, positionY: -28 },
    left: { horizontalAnchor: "left", verticalAnchor: "center", positionX: 28, positionY: 0 }
  };

  function spec(name) {
    return normaliseSpec({
      animations: ["slide"],
      sizeMode: "absolute",
      sizeWidth: 104,
      sizeHeight: 104,
      duration: 1200,
      ...placements[name]
    });
  }

  const navigator = createStateNavigator({
    initial: "top",
    buttons,
    selector: "[data-state-target]",
    apply(name) {
      applyFrame(object, destinationFrame(object, stage, spec(name)));
    },
    transition(from, to) {
      return animateBetweenStates(object, stage, spec(from), spec(to));
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.stateTarget)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("top", { animate: false });
    await nextFrame();

    for (const name of ["right", "bottom", "left", "top"]) {
      await navigator.go(name);
    }
  });
}

if (demo === "spacing") {
  const paddingBox = document.querySelector("#paddingBox");
  const marginInner = document.querySelector("#marginInner");
  const buttons = [...document.querySelectorAll("[data-state-target]")];

  const states = {
    compact: {
      padding: "8px",
      margin: "8px"
    },
    expanded: {
      padding: "56px 28px",
      margin: "56px 28px"
    }
  };

  const navigator = createStateNavigator({
    initial: "compact",
    buttons,
    selector: "[data-state-target]",
    apply(name) {
      paddingBox.style.padding = states[name].padding;
      marginInner.style.margin = states[name].margin;
    },
    async transition(from, to) {
      paddingBox.style.padding = states[to].padding;
      marginInner.style.margin = states[to].margin;

      const animations = [
        runAnimation(
          paddingBox,
          [
            { padding: states[from].padding },
            { padding: states[to].padding }
          ],
          { duration: 1800 }
        ),
        runAnimation(
          marginInner,
          [
            { margin: states[from].margin },
            { margin: states[to].margin }
          ],
          { duration: 1800 }
        )
      ];

      await Promise.all(
        animations.map(async (animation) => {
          try {
            await animation?.finished;
          } catch {}
        })
      );
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.stateTarget)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("compact", { animate: false });
    await nextFrame();
    await navigator.go("expanded");
  });
}

if (demo === "cube") {
  const cube = document.querySelector(".cube");
  const buttons = [...document.querySelectorAll("[data-state-target]")];
  const states = {
    one: "rotateX(-18deg) rotateY(-25deg) rotateZ(0deg)",
    two: "rotateX(342deg) rotateY(695deg) rotateZ(180deg)"
  };

  const navigator = createStateNavigator({
    initial: "one",
    buttons,
    selector: "[data-state-target]",
    apply(name) {
      cube.style.transform = states[name];
    },
    async transition(from, to) {
      cube.style.transform = states[to];
      const animation = runAnimation(
        cube,
        [
          { transform: states[from] },
          { transform: states[to] }
        ],
        { duration: 3600, easing: "cubic-bezier(.22,.75,.18,1)" }
      );

      try {
        await animation?.finished;
      } catch {}
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.stateTarget)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("one", { animate: false });
    await nextFrame();
    await navigator.go("two");
  });
}

if (demo === "parallax") {
  const scene = document.querySelector(".parallax-scene");
  const layers = [...document.querySelectorAll(".parallax-layer")];
  const depths = [18, 34, 58];

  function position(x, y) {
    layers.forEach((layer, index) => {
      const depth = depths[index];
      layer.style.transform =
        `translate(-50%, -50%) translate3d(${x * depth}px, ${y * depth}px, ${index * 55}px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg)`;
    });
  }

  scene.addEventListener("pointermove", (event) => {
    const rect = scene.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - .5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - .5) * 2;
    position(x, y);
  });
  scene.addEventListener("pointerleave", () => position(0, 0));

  replay?.addEventListener("click", () => {
    layers.forEach((layer, index) => {
      const depth = depths[index];
      runAnimation(
        layer,
        [
          { transform: `translate(-50%, -50%) translate3d(${-depth}px, ${depth * .5}px, ${index * 55}px) rotateX(-6deg) rotateY(-9deg)` },
          { transform: `translate(-50%, -50%) translate3d(${depth}px, ${-depth * .5}px, ${index * 55}px) rotateX(6deg) rotateY(9deg)` },
          { transform: `translate(-50%, -50%) translate3d(0, 0, ${index * 55}px) rotateX(0deg) rotateY(0deg)` }
        ],
        { duration: 2200 }
      );
    });
  });

  position(0, 0);
}

if (demo === "coverflow") {
  const covers = [...document.querySelectorAll(".cover")];
  let active = 2;

  function layout(index, animate = true) {
    active = (index + covers.length) % covers.length;

    covers.forEach((cover, coverIndex) => {
      const delta = coverIndex - active;
      const abs = Math.abs(delta);
      const x = delta * 118;
      const z = abs === 0 ? 120 : -abs * 75;
      const y = abs * 8;
      const rotateY = delta < 0 ? 58 : delta > 0 ? -58 : 0;
      const opacity = abs > 2 ? .25 : 1;
      const transform =
        `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotateY}deg) scale(${abs === 0 ? 1.08 : .86})`;

      if (!animate) {
        cover.style.transform = transform;
        cover.style.opacity = opacity;
        return;
      }

      runAnimation(
        cover,
        [
          { transform: getComputedStyle(cover).transform === "none" ? cover.style.transform || transform : getComputedStyle(cover).transform, opacity: getComputedStyle(cover).opacity },
          { transform, opacity }
        ],
        { duration: 900 }
      ).finished.then(() => {
        cover.style.transform = transform;
        cover.style.opacity = opacity;
      }).catch(() => {});
    });
  }

  document.querySelector("[data-prev]")?.addEventListener("click", () => layout(active - 1));
  document.querySelector("[data-next]")?.addEventListener("click", () => layout(active + 1));
  replay?.addEventListener("click", async () => {
    layout(0, false);
    await nextFrame();
    for (let index = 1; index < covers.length; index += 1) {
      layout(index);
      await new Promise((resolve) => setTimeout(resolve, 780));
    }
  });
  layout(active, false);
}

if (demo === "stagger") {
  const cards = [...document.querySelectorAll(".stagger-card")];
  const buttons = [...document.querySelectorAll("[data-state-target]")];
  const states = {
    hidden: {
      transform: "translateY(70px) rotate(-8deg)",
      opacity: "0"
    },
    visible: {
      transform: "translateY(0) rotate(0deg)",
      opacity: "1"
    }
  };

  const navigator = createStateNavigator({
    initial: "visible",
    buttons,
    selector: "[data-state-target]",
    apply(name) {
      cards.forEach((card) => Object.assign(card.style, states[name]));
    },
    async transition(from, to) {
      const animations = cards.map((card, index) => {
        Object.assign(card.style, states[to]);
        const delayIndex = to === "visible"
          ? index
          : cards.length - 1 - index;

        return runAnimation(
          card,
          [states[from], states[to]],
          { duration: 760, delay: delayIndex * 120 }
        );
      });

      await Promise.all(
        animations.map(async (animation) => {
          try {
            await animation?.finished;
          } catch {}
        })
      );
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.stateTarget)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("hidden", { animate: false });
    await nextFrame();
    await navigator.go("visible");
  });
}

if (demo === "reveal-collapse") {
  const revealCard = document.querySelector("#revealCard");
  const collapseCard = document.querySelector("#collapseCard");
  const buttons = [...document.querySelectorAll("[data-state-target]")];

  const states = {
    closed: {
      reveal: {
        clipPath: "inset(0 100% 0 0)"
      },
      collapse: {
        transform: "scaleX(.08)",
        transformOrigin: "left center"
      }
    },
    open: {
      reveal: {
        clipPath: "inset(0 0 0 0)"
      },
      collapse: {
        transform: "scaleX(1)",
        transformOrigin: "left center"
      }
    }
  };

  const navigator = createStateNavigator({
    initial: "open",
    buttons,
    selector: "[data-state-target]",
    apply(name) {
      Object.assign(revealCard.style, states[name].reveal);
      Object.assign(collapseCard.style, states[name].collapse);
    },
    async transition(from, to) {
      Object.assign(revealCard.style, states[to].reveal);
      Object.assign(collapseCard.style, states[to].collapse);

      const animations = [
        runAnimation(
          revealCard,
          [states[from].reveal, states[to].reveal],
          { duration: 1500 }
        ),
        runAnimation(
          collapseCard,
          [states[from].collapse, states[to].collapse],
          { duration: 1500 }
        )
      ];

      await Promise.all(
        animations.map(async (animation) => {
          try {
            await animation?.finished;
          } catch {}
        })
      );
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.stateTarget)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("closed", { animate: false });
    await nextFrame();
    await navigator.go("open");
  });
}

if (demo === "responsive") {
  const frame = document.querySelector(".responsive-frame");
  const object = stageObject();
  prepareFrameworkObject(object);
  const buttons = [...document.querySelectorAll("[data-state-target]")];

  function spec(name) {
    const first = name === "a";

    return normaliseSpec({
      animations: ["slide"],
      horizontalAnchor: first ? "left" : "right",
      verticalAnchor: first ? "top" : "bottom",
      positionMode: "percent",
      positionX: first ? 6 : -6,
      positionY: first ? 8 : -8,
      sizeMode: "percent",
      sizeWidth: 24,
      sizeHeight: 24,
      duration: 1400
    });
  }

  const navigator = createStateNavigator({
    initial: "a",
    buttons,
    selector: "[data-state-target]",
    apply(name) {
      applyFrame(object, destinationFrame(object, frame, spec(name)));
    },
    transition(from, to) {
      return animateBetweenStates(object, frame, spec(from), spec(to));
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.stateTarget)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("a", { animate: false });
    await nextFrame();
    await navigator.go("b");
  });

  window.addEventListener("resize", () => {
    if (!navigator.running) navigator.reapply();
  });
}

if (demo === "reduced-motion") {
  const motion = document.querySelector("#motionObject");
  const reduced = document.querySelector("#reducedObject");
  const buttons = [...document.querySelectorAll("[data-state-target]")];

  const states = {
    one: {
      transform: "translateX(-110px) rotate(-25deg)",
      opacity: "0.45"
    },
    two: {
      transform: "translateX(110px) rotate(25deg)",
      opacity: "1"
    }
  };

  function applyState(element, name) {
    element.getAnimations?.().forEach((animation) => animation.cancel());
    Object.assign(element.style, states[name]);
  }

  const navigator = createStateNavigator({
    initial: "one",
    buttons,
    selector: "[data-state-target]",
    apply(name) {
      applyState(motion, name);
      applyState(reduced, name);
    },
    async transition(from, to) {
      // Reduced motion resolves to the exact semantic destination immediately.
      applyState(reduced, to);

      const animation = runAnimation(
        motion,
        [states[from], states[to]],
        { duration: 1600 }
      );

      try {
        await animation.finished;
      } catch {}

      applyState(motion, to);
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.stateTarget)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("one", { animate: false });
    await nextFrame();
    await navigator.go("two");
  });
}

