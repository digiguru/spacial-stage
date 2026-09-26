const demo = document.body.dataset.demo;
const object = document.querySelector("#focusedObject");
const replay = document.querySelector("#focusedReplay");

function activate(button, selector) {
  document.querySelectorAll(selector).forEach((item) => item.classList.toggle("is-active", item === button));
}

function animateObject(frames, options = {}) {
  if (!object?.animate) return null;
  object.getAnimations().forEach((animation) => animation.cancel());
  return object.animate(frames, {
    duration: 760,
    easing: "cubic-bezier(.2,.82,.24,1)",
    fill: "forwards",
    ...options
  });
}

function createVisualStateNavigator({
  initial,
  buttons,
  selector,
  apply,
  transition
}) {
  let current = initial;
  let running = false;
  let pending = null;

  function sync(target = current) {
    const active = buttons.find((button) =>
      button.dataset.state === target || button.dataset.depth === target
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
      sync();
      return;
    }

    running = true;
    sync(next);

    try {
      if (animate) await transition(current, next);
      else await apply(next);
      current = next;
    } finally {
      running = false;
      sync();

      if (pending && pending !== current) {
        const queued = pending;
        pending = null;
        void go(queued);
      } else {
        pending = null;
      }
    }
  }

  apply(initial);
  sync();

  return { go };
}

if (demo === "animations") {
  let preset = "slide-fade";
  let state = "two";
  let running = false;
  let pending = null;
  const presetButtons = [...document.querySelectorAll("[data-preset]")];
  const stateButtons = [...document.querySelectorAll("[data-motion-state]")];

  const frames = {
    "slide-fade": {
      one: {
        transform: "translate3d(-140px, 70px, 0) scale(.82)",
        opacity: "0",
        clipPath: "inset(0 0 0 0)",
        filter: "blur(0) saturate(1)"
      },
      two: {
        transform: "translate3d(0, 0, 0) scale(1)",
        opacity: "1",
        clipPath: "inset(0 0 0 0)",
        filter: "blur(0) saturate(1)"
      }
    },
    reveal: {
      one: {
        clipPath: "inset(0 100% 0 0)",
        transform: "translate3d(0,0,0)",
        opacity: "1",
        filter: "blur(0) saturate(1)"
      },
      two: {
        clipPath: "inset(0 0 0 0)",
        transform: "translate3d(0,0,0)",
        opacity: "1",
        filter: "blur(0) saturate(1)"
      }
    },
    "focus-collapse": {
      one: {
        filter: "blur(18px) saturate(.72)",
        transform: "scale(.2,.92)",
        opacity: "0.45",
        clipPath: "inset(0 0 0 0)"
      },
      two: {
        filter: "blur(0) saturate(1)",
        transform: "scale(1,1)",
        opacity: "1",
        clipPath: "inset(0 0 0 0)"
      }
    }
  };

  function syncStateButtons(target = state) {
    const active = stateButtons.find(
      (button) => button.dataset.motionState === target
    );
    activate(active, "[data-motion-state]");
    stateButtons.forEach((button) =>
      button.setAttribute("aria-pressed", String(button === active))
    );
  }

  function applyState(name) {
    object.getAnimations().forEach((animation) => animation.cancel());
    Object.assign(object.style, frames[preset][name]);
  }

  async function goState(next, { animate = true } = {}) {
    if (running) {
      pending = next;
      return;
    }
    if (next === state) {
      syncStateButtons();
      return;
    }

    running = true;
    syncStateButtons(next);

    try {
      if (!animate) {
        applyState(next);
      } else {
        Object.assign(object.style, frames[preset][next]);
        const animation = animateObject(
          [frames[preset][state], frames[preset][next]]
        );
        try {
          await animation?.finished;
        } catch {}
      }
      state = next;
    } finally {
      running = false;
      syncStateButtons();

      if (pending && pending !== state) {
        const queued = pending;
        pending = null;
        void goState(queued);
      } else {
        pending = null;
      }
    }
  }

  presetButtons.forEach((button) =>
    button.addEventListener("click", () => {
      preset = button.dataset.preset;
      activate(button, "[data-preset]");
      applyState(state);
    })
  );

  stateButtons.forEach((button) =>
    button.addEventListener("click", () =>
      void goState(button.dataset.motionState)
    )
  );

  replay?.addEventListener("click", async () => {
    await goState("one", { animate: false });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => void goState("two"))
    );
  });

  applyState(state);
  syncStateButtons();
}

if (demo === "geometry") {
  const buttons = [...document.querySelectorAll("[data-state]")];
  const states = {
    a: { left: "8%", top: "13%", width: "190px", transform: "rotateZ(-12deg) scale(.92)" },
    b: { left: "58%", top: "47%", width: "300px", transform: "rotateZ(24deg) scale(1.06)" }
  };

  const navigator = createVisualStateNavigator({
    initial: "a",
    buttons,
    selector: "[data-state]",
    apply(name) {
      Object.assign(object.style, states[name]);
    },
    async transition(from, to) {
      Object.assign(object.style, states[to]);
      const animation = animateObject(
        [
          {
            left: states[from].left,
            top: states[from].top,
            width: states[from].width,
            transform: states[from].transform
          },
          {
            left: states[to].left,
            top: states[to].top,
            width: states[to].width,
            transform: states[to].transform
          }
        ],
        { duration: 820 }
      );
      try {
        await animation?.finished;
      } catch {}
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.state)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("a", { animate: false });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => void navigator.go("b"))
    );
  });
}

if (demo === "layout") {
  let layout = "overlay";
  let state = "two";
  let running = false;
  let pending = null;
  const content = document.querySelector("#layoutContent");
  const layoutButtons = [...document.querySelectorAll("[data-layout]")];
  const stateButtons = [...document.querySelectorAll("[data-motion-state]")];

  const objectStates = {
    one: {
      transform: "translate3d(-105%,0,0)",
      opacity: "0.4"
    },
    two: {
      transform: "translate3d(0,0,0)",
      opacity: "1"
    }
  };

  function contentFrames() {
    return {
      overlay: [
        { transform: "translate3d(0,0,0)", opacity: 1, filter: "blur(0)" },
        { transform: "translate3d(0,0,0)", opacity: 1, filter: "blur(0)" }
      ],
      push: [
        { transform: "translate3d(0,0,0)", opacity: 1 },
        { transform: "translate3d(120px,0,0)", opacity: 1 },
        { transform: "translate3d(0,0,0)", opacity: 1 }
      ],
      replace: [
        { transform: "scale(1)", opacity: 1, filter: "blur(0)" },
        { transform: "scale(.97)", opacity: .08, filter: "blur(8px)" },
        { transform: "scale(1)", opacity: 1, filter: "blur(0)" }
      ],
      reflow: [
        { transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
        { transform: "translate3d(90px,0,0) scale(.92)", opacity: .68 },
        { transform: "translate3d(0,0,0) scale(1)", opacity: 1 }
      ]
    }[layout];
  }

  function syncStateButtons(target = state) {
    const active = stateButtons.find(
      (button) => button.dataset.motionState === target
    );
    activate(active, "[data-motion-state]");
    stateButtons.forEach((button) =>
      button.setAttribute("aria-pressed", String(button === active))
    );
  }

  function applyState(name) {
    object.getAnimations().forEach((animation) => animation.cancel());
    Object.assign(object.style, objectStates[name]);
  }

  async function goState(next, { animate = true } = {}) {
    if (running) {
      pending = next;
      return;
    }
    if (next === state) {
      syncStateButtons();
      return;
    }

    running = true;
    syncStateButtons(next);

    try {
      if (!animate) {
        applyState(next);
      } else {
        Object.assign(object.style, objectStates[next]);
        const objectAnimation = animateObject(
          [objectStates[state], objectStates[next]],
          { duration: 720 }
        );
        const companionAnimation = content.animate(
          contentFrames(),
          {
            duration: 720,
            easing: "cubic-bezier(.2,.82,.24,1)",
            fill: "both"
          }
        );

        try {
          await Promise.all([
            objectAnimation?.finished,
            companionAnimation.finished
          ]);
        } catch {}
      }
      state = next;
    } finally {
      running = false;
      syncStateButtons();

      if (pending && pending !== state) {
        const queued = pending;
        pending = null;
        void goState(queued);
      } else {
        pending = null;
      }
    }
  }

  layoutButtons.forEach((button) =>
    button.addEventListener("click", async () => {
      layout = button.dataset.layout;
      activate(button, "[data-layout]");

      await goState("one", { animate: false });
      requestAnimationFrame(() =>
        requestAnimationFrame(() => void goState("two"))
      );
    })
  );

  stateButtons.forEach((button) =>
    button.addEventListener("click", () =>
      void goState(button.dataset.motionState)
    )
  );

  replay?.addEventListener("click", async () => {
    await goState("one", { animate: false });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => void goState("two"))
    );
  });

  applyState(state);
  syncStateButtons();
}

if (demo === "depth") {
  const buttons = [...document.querySelectorAll("[data-depth]")];
  const states = {
    blur: {
      filter: "blur(14px) saturate(.82)",
      opacity: "0.34",
      transform: "scale(.96)"
    },
    focus: {
      filter: "blur(0px) saturate(1)",
      opacity: "1",
      transform: "scale(1)"
    }
  };

  const navigator = createVisualStateNavigator({
    initial: "blur",
    buttons,
    selector: "[data-depth]",
    apply(name) {
      Object.assign(object.style, states[name]);
    },
    async transition(from, to) {
      Object.assign(object.style, states[to]);
      const animation = animateObject(
        [states[from], states[to]],
        { duration: 760 }
      );
      try {
        await animation?.finished;
      } catch {}
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.depth)
    )
  );

  replay?.addEventListener("click", () =>
    void navigator.go(
      buttons.find((button) => button.classList.contains("is-active"))
        ?.dataset.depth === "blur"
        ? "focus"
        : "blur"
    )
  );
}

if (demo === "3d") {
  const buttons = [...document.querySelectorAll("[data-state]")];
  const states = {
    front: "perspective(850px) translate3d(0,0,0) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)",
    tilt: "perspective(650px) translate3d(0,-12px,110px) rotateX(-18deg) rotateY(32deg) rotateZ(7deg) scale(1.04)"
  };

  const navigator = createVisualStateNavigator({
    initial: "front",
    buttons,
    selector: "[data-state]",
    apply(name) {
      object.style.transform = states[name];
    },
    async transition(from, to) {
      object.style.transform = states[to];
      const animation = animateObject(
        [{ transform: states[from] }, { transform: states[to] }],
        { duration: 900 }
      );
      try {
        await animation?.finished;
      } catch {}
    }
  });

  buttons.forEach((button) =>
    button.addEventListener("click", () =>
      void navigator.go(button.dataset.state)
    )
  );

  replay?.addEventListener("click", async () => {
    await navigator.go("front", { animate: false });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => void navigator.go("tilt"))
    );
  });
}

