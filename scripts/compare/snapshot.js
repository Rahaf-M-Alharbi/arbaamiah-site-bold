// Records the computed style of every element (and its ::before/::after) so two builds can be compared exactly.
// Paste into the browser console on the page, after starting `node scripts/compare/collect.mjs`, and set TAG first.
// It scrolls through the page once (so scroll-triggered states are reached), then records at the bottom and at the top,
// with every animation paused at its start so nothing is caught mid-motion.
(async () => {
  const TAG = window.TAG || "snapshot";
  const wait = (t) => new Promise((r) => setTimeout(r, t));
  await wait(3500); /* loader gone, fonts in */
  const freeze = () => document.getAnimations().forEach((a) => { try { if (a.constructor.name === "CSSTransition") a.finish(); else { a.pause(); a.currentTime = 0; } } catch (e) {} });
  const key = (e) => { const p = []; let x = e; while (x && x !== document.documentElement) { p.unshift(x.tagName + (x.id ? "#" + x.id : "") + ":" + [...x.parentNode.children].indexOf(x)); x = x.parentNode; } return p.join(">"); };
  const capture = () => {
    freeze();
    const out = {};
    for (const e of [document.documentElement, ...document.querySelectorAll("body, body *")]) {
      for (const ps of [null, "::before", "::after"]) {
        const cs = getComputedStyle(e, ps);
        if (ps && cs.content === "none") continue;
        const s = [];
        for (let i = 0; i < cs.length; i++) s.push(cs[i] + "\u0002" + cs.getPropertyValue(cs[i]));
        out[key(e) + (ps || "")] = s.join("\u0001");
      }
    }
    return out;
  };
  const res = {}, H = document.documentElement.scrollHeight - innerHeight;
  for (let y = 0; y <= H; y += Math.round(innerHeight * 0.7)) { scrollTo(0, y); await wait(120); }
  scrollTo(0, H); await wait(1500); res.bottom = capture();
  scrollTo(0, 0); await wait(1500); res.top = capture();
  await fetch("http://localhost:8090/" + TAG, { method: "POST", body: JSON.stringify(res) });
  console.log("saved", TAG, innerWidth + "px", Object.keys(res.top).length, "elements");
})();
