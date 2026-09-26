const demo = document.body.dataset.demo;
const object = document.querySelector("#focusedObject");
const replay = document.querySelector("#focusedReplay");

function activate(button, selector) {
  document.querySelectorAll(selector).forEach((item) => item.classList.toggle("is-active", item === button));
}

function animateObject(frames, options = {}) {
  if (!object?.animate) return;
  object.getAnimations().forEach((animation) => animation.cancel());
  object.animate(frames, {
    duration: 760,
    easing: "cubic-bezier(.2,.82,.24,1)",
    fill: "forwards",
    ...options
  });
}

if (demo === "animations") {
  let preset = "slide-fade";
  const buttons = [...document.querySelectorAll("[data-preset]")];

  function run() {
    const frames = {
      "slide-fade": [
        { transform: "translate3d(-140px, 70px, 0) scale(.82)", opacity: 0 },
        { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1 }
      ],
      reveal: [
        { clipPath: "inset(0 100% 0 0)", transform: "translate3d(0,0,0)", opacity: 1 },
        { clipPath: "inset(0 0 0 0)", transform: "translate3d(0,0,0)", opacity: 1 }
      ],
      "focus-collapse": [
        { filter: "blur(18px) saturate(.72)", transform: "scale(.2,.92)", opacity: .45 },
        { filter: "blur(0) saturate(1)", transform: "scale(1,1)", opacity: 1 }
      ]
    }[preset];
    animateObject(frames);
  }

  buttons.forEach((button) => button.addEventListener("click", () => {
    preset = button.dataset.preset;
    activate(button, "[data-preset]");
    run();
  }));
  replay?.addEventListener("click", run);
  run();
}

if (demo === "geometry") {
  let state = "a";
  const buttons = [...document.querySelectorAll("[data-state]")];
  const states = {
    a: { left: "8%", top: "13%", width: "190px", transform: "rotateZ(-12deg) scale(.92)" },
    b: { left: "58%", top: "47%", width: "300px", transform: "rotateZ(24deg) scale(1.06)" }
  };

  function set(next, animate = true) {
    const previous = state;
    state = next;
    const target = states[next];
    const from = states[previous];
    activate(buttons.find((button) => button.dataset.state === next), "[data-state]");

    if (!animate || !object?.animate) {
      Object.assign(object.style, target);
      return;
    }

    Object.assign(object.style, target);
    object.animate(
      [
        { left: from.left, top: from.top, width: from.width, transform: from.transform },
        { left: target.left, top: target.top, width: target.width, transform: target.transform }
      ],
      { duration: 820, easing: "cubic-bezier(.2,.82,.24,1)", fill: "both" }
    );
  }

  buttons.forEach((button) => button.addEventListener("click", () => set(button.dataset.state)));
  replay?.addEventListener("click", () => {
    set("a", false);
    requestAnimationFrame(() => requestAnimationFrame(() => set("b", true)));
  });
  set("a", false);
}

if (demo === "layout") {
  let layout = "overlay";
  const content = document.querySelector("#layoutContent");
  const buttons = [...document.querySelectorAll("[data-layout]")];

  function run() {
    object.getAnimations().forEach((animation) => animation.cancel());
    content.getAnimations().forEach((animation) => animation.cancel());

    object.animate(
      [
        { transform: "translate3d(-105%,0,0)", opacity: .4 },
        { transform: "translate3d(0,0,0)", opacity: 1 }
      ],
      { duration: 720, easing: "cubic-bezier(.2,.82,.24,1)", fill: "both" }
    );

    const frames = {
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

    content.animate(frames, { duration: 720, easing: "cubic-bezier(.2,.82,.24,1)", fill: "both" });
  }

  buttons.forEach((button) => button.addEventListener("click", () => {
    layout = button.dataset.layout;
    activate(button, "[data-layout]");
    run();
  }));
  replay?.addEventListener("click", run);
  run();
}

if (demo === "depth") {
  let depth = "blur";
  const buttons = [...document.querySelectorAll("[data-depth]")];

  function apply(next) {
    depth = next;
    activate(buttons.find((button) => button.dataset.depth === next), "[data-depth]");
    animateObject(
      depth === "blur"
        ? [
            { filter: "blur(0) saturate(1)", opacity: 1 },
            { filter: "blur(14px) saturate(.82)", opacity: .34 }
          ]
        : [
            { filter: "blur(14px) saturate(.82)", opacity: .34 },
            { filter: "blur(0) saturate(1)", opacity: 1 }
          ]
    );
  }

  buttons.forEach((button) => button.addEventListener("click", () => apply(button.dataset.depth)));
  replay?.addEventListener("click", () => apply(depth === "blur" ? "focus" : "blur"));
  apply("blur");
}

if (demo === "3d") {
  let state = "front";
  const buttons = [...document.querySelectorAll("[data-state]")];
  const states = {
    front: "perspective(850px) translate3d(0,0,0) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)",
    tilt: "perspective(650px) translate3d(0,-12px,110px) rotateX(-18deg) rotateY(32deg) rotateZ(7deg) scale(1.04)"
  };

  function set(next, animate = true) {
    const from = states[state];
    const to = states[next];
    state = next;
    activate(buttons.find((button) => button.dataset.state === next), "[data-state]");
    if (!animate) {
      object.style.transform = to;
      return;
    }
    animateObject([{ transform: from }, { transform: to }], { duration: 900 });
  }

  buttons.forEach((button) => button.addEventListener("click", () => set(button.dataset.state)));
  replay?.addEventListener("click", () => {
    set("front", false);
    requestAnimationFrame(() => requestAnimationFrame(() => set("tilt", true)));
  });
  set("front", false);
}
