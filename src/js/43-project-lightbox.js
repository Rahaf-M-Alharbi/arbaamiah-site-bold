/* project pages: image viewer with a strip, page-flip viewer, clip player, filter chips; projects page "show all" */

/* small overlay shared by the image zoom and the clip player: arrows, swipe, Esc, a click outside closes */
const overlay = ({ label, count, node, draw, clear }) => {
  let i = 0, box, el, num, last;
  const show = () => { draw(el, i); num.textContent = `${i + 1} / ${count}`; };
  const go = (d) => { i = (i + d + count) % count; show(); };
  const close = () => {
    box.hidden = true;
    document.documentElement.classList.remove("lb-on");
    if (clear) clear(el);
    if (last) last.focus();
  };
  const build = () => {
    box = document.createElement("div");
    box.className = "lb";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", label);
    box.innerHTML = '<div class="lb-card" dir="rtl"><button class="lb-x" type="button" aria-label="إغلاق">×</button><button class="lb-nav lb-prev" dir="ltr" type="button" aria-label="السابق">›</button><button class="lb-nav lb-next" dir="ltr" type="button" aria-label="التالي">‹</button><span class="lb-n" dir="ltr"></span></div>';
    document.body.appendChild(box);
    el = node();
    box.querySelector(".lb-prev").after(el);
    num = box.querySelector(".lb-n");
    box.addEventListener("click", (e) => {
      if (e.target === box) close();
      else if (e.target.closest(".lb-x")) close();
      else if (e.target.closest(".lb-prev")) go(-1);
      else if (e.target.closest(".lb-next")) go(1);
    });
    let x0 = null;
    box.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) go(dx > 0 ? 1 : -1);
    });
    /* the page reads right to left: the left arrow goes forward */
    document.addEventListener("keydown", (e) => {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(1);
      else if (e.key === "ArrowRight") go(-1);
    });
  };
  return (n) => {
    if (!box) build();
    last = document.activeElement;
    i = n;
    show();
    box.hidden = false;
    document.documentElement.classList.add("lb-on");
    box.querySelector(".lb-x").focus();
  };
};
const plain = (e) => !(e.ctrlKey || e.metaKey || e.shiftKey);
const player = (a) => {
  const f = document.createElement("iframe");
  f.src = a.dataset.embed;
  f.title = a.dataset.title;
  f.allow = "autoplay; fullscreen";
  f.allowFullscreen = true;
  f.referrerPolicy = "no-referrer";
  return f;
};

/* images: click one to see it larger */
let zoom = null;
try {
  const all = [...document.querySelectorAll(".pj-fig:not(.pj-vf)")];
  if (all.length) zoom = overlay({
    label: "عرض الصورة",
    count: all.length,
    node: () => { const im = new Image(); im.className = "lb-img"; return im; },
    draw: (im, i) => {
      im.src = all[i].href;
      im.alt = all[i].querySelector("img").alt;
      [i - 1, i + 1].forEach((j) => { if (all[j]) new Image().src = all[j].href; });
    },
  });
} catch (e) {}

/* one big picture (or two pages side by side in a book), arrows, counter, strip of small ones */
try {
  document.querySelectorAll(".pj-view").forEach((v) => {
    const full = [...v.querySelectorAll(".pj-fig")], mains = [...v.querySelectorAll(".pj-main")];
    const strip = v.querySelector(".pj-strip"), cnt = v.querySelector(".pj-cnt"), stage = v.querySelector(".pj-stage");
    const book = v.dataset.mode === "book", wide = matchMedia("(min-width:900px)");
    let thumbs = full, n = full.length;
    const isVid = (t) => !!(t && (t.dataset.video || t.dataset.embed));
    let vid = null, emb = null;
    let cur = 0;
    const per = () => {
      const base = thumbs.filter(isVid).length;
      return book && mains.length > 1 && wide.matches && !isVid(thumbs[cur]) && !isVid(thumbs[cur + 1]) && thumbs[base] && +thumbs[base].dataset.h >= +thumbs[base].dataset.w ? 2 : 1;
    };
    const render = () => {
      const p = per();
      const base = thumbs.filter(isVid).length;
      if (cur >= base) cur = base + Math.floor((cur - base) / p) * p;
      const cv = isVid(thumbs[cur]);
      if (emb) { emb.hidden = true; emb.replaceChildren(); }
      if (vid) { vid.pause(); vid.hidden = true; }
      if (cv && thumbs[cur].dataset.embed) {
        const t = thumbs[cur];
        if (!emb) {
          emb = document.createElement("div");
          emb.className = "pj-mainemb";
          mains[0].after(emb);
        }
        emb.hidden = false;
        emb.style.setProperty("--r", t.dataset.w / t.dataset.h);
        const go = document.createElement("button");
        go.type = "button";
        go.className = "pj-mainplay";
        go.setAttribute("aria-label", "تشغيل: " + t.dataset.title);
        go.innerHTML = `<img src="${t.dataset.poster}" alt="" referrerpolicy="no-referrer"><b>${t.dataset.title}</b><i aria-hidden="true">${t.dataset.k === "write" ? "✎" : "▶"}</i>`;
        go.querySelector("img").onerror = (e) => e.target.remove();
        go.addEventListener("click", () => emb.replaceChildren(player(t)));
        emb.replaceChildren(go);
      } else if (cv) {
        if (!vid) {
          vid = document.createElement("video");
          vid.className = "pj-mainvid";
          vid.controls = vid.muted = vid.playsInline = true;
          vid.preload = "metadata";
          mains[0].after(vid);
        }
        const t = thumbs[cur];
        vid.hidden = false;
        vid.poster = t.dataset.poster;
        vid.src = t.dataset.video;
        vid.setAttribute("aria-label", t.firstElementChild.alt);
        vid.style.aspectRatio = `${t.dataset.w} / ${t.dataset.h}`;
      }
      mains.forEach((m, k) => {
        const t = thumbs[cur + k];
        m.hidden = k >= p || !t || cv;
        if (m.hidden) return;
        const im = m.firstElementChild;
        m.href = t.href;
        im.src = t.href;
        im.alt = t.firstElementChild.alt;
        im.width = t.dataset.w;
        im.height = t.dataset.h;
      });
      thumbs.forEach((t, k) => (k >= cur && k < cur + p ? t.setAttribute("aria-current", "true") : t.removeAttribute("aria-current")));
      cnt.textContent = p === 2 && thumbs[cur + 1] ? `${cur + 1}–${cur + 2} / ${n}` : `${cur + 1} / ${n}`;
      const t = thumbs[cur];
      if (strip.scrollWidth > strip.clientWidth) {
        const rtl = getComputedStyle(strip).direction === "rtl";
        const x = t.offsetLeft + t.offsetWidth / 2 - strip.clientWidth / 2;
        strip.scrollTo({ left: rtl ? x - (strip.scrollWidth - strip.clientWidth) : x, behavior: "smooth" });
      }
      [cur + p, cur + p + 1].forEach((j) => { if (thumbs[j] && !isVid(thumbs[j])) new Image().src = thumbs[j].href; });
    };
    const step = (d) => {
      const p = per();
      cur += d * p;
      if (cur >= n) cur = 0;
      else if (cur < 0) cur = Math.floor((n - 1) / p) * p;
      render();
    };
    v.querySelectorAll(".pj-sn").forEach((b) => b.addEventListener("click", () => step(+b.dataset.d)));
    full.forEach((t) => t.addEventListener("click", (e) => {
      if (!plain(e)) return;
      e.preventDefault();
      cur = thumbs.indexOf(t);
      render();
    }));
    mains.forEach((m, k) => m.addEventListener("click", (e) => {
      if (!plain(e)) return;
      e.preventDefault();
      if (zoom) zoom(Math.max(0, full.slice(0, full.indexOf(thumbs[cur + k])).filter((x) => !isVid(x)).length));
    }));
    /* the page reads right to left: the left arrow goes forward */
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") step(1);
      else if (e.key === "ArrowRight") step(-1);
    });
    let x0 = null;
    stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) step(dx > 0 ? 1 : -1);
    });
    /* the tags in the page head pick what the gallery shows: clips or pictures; picking the same one again shows everything */
    const tagBtns = [...document.querySelectorAll(".pj-tags [data-f]")];
    tagBtns.forEach((b) => b.addEventListener("click", () => {
      const on = b.getAttribute("aria-pressed") !== "true";
      tagBtns.forEach((x) => x.setAttribute("aria-pressed", String(on && x === b)));
      const want = on ? b.dataset.f : "all";
      thumbs = full.filter((t) => want === "all" || t.dataset.k === want);
      full.forEach((t) => { t.hidden = !thumbs.includes(t); });
      n = thumbs.length;
      cur = 0;
      render();
    }));
    wide.addEventListener("change", render);
    render();
  });
} catch (e) {}

/* Drive players: nothing heavy loads until the visitor clicks play.
   The big player in the middle plays one clip at a time; the arrows and the strip swap which one. */
try {
  document.querySelectorAll(".pj-clips").forEach((w) => {
    const ths = [...w.querySelectorAll(".pj-th")], slot = w.querySelector(".pj-clip"), cnt = w.querySelector(".pj-cnt"), cap = w.querySelector(".pj-ct");
    let cur = 0;
    const playAt = (k) => {
      cur = (k + ths.length) % ths.length;
      const fig = document.createElement("figure");
      fig.className = "pj-embed";
      fig.appendChild(player(ths[cur]));
      slot.replaceChildren(fig);
      ths.forEach((t, j) => (j === cur ? t.setAttribute("aria-current", "true") : t.removeAttribute("aria-current")));
      cnt.textContent = `${cur + 1} / ${ths.length}`;
      if (cap) cap.textContent = ths[cur].dataset.title;
      const t = ths[cur], strip = t.parentNode;
      if (strip.scrollWidth > strip.clientWidth) {
        const x = t.offsetLeft + t.offsetWidth / 2 - strip.clientWidth / 2;
        strip.scrollTo({ left: getComputedStyle(strip).direction === "rtl" ? x - (strip.scrollWidth - strip.clientWidth) : x, behavior: "smooth" });
      }
    };
    ths.forEach((t, k) => t.addEventListener("click", (e) => {
      if (!plain(e)) return;
      e.preventDefault();
      playAt(k);
      slot.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }));
    w.querySelectorAll(".pj-cn").forEach((b) => b.addEventListener("click", () => playAt(cur + +b.dataset.d)));
  });
  /* a lone player (or the big slot before anything is chosen) loads on its own click */
  document.querySelectorAll(".pj-facade:not(.pj-th)").forEach((a) => a.addEventListener("click", (e) => {
    if (!plain(e)) return;
    e.preventDefault();
    const fig = document.createElement("figure");
    fig.className = "pj-embed";
    fig.appendChild(player(a));
    a.replaceWith(fig);
  }));
} catch (e) {}

/* a project with videos and designs: chips show one kind at a time */
try {
  document.querySelectorAll(".pj-page .pj-chips").forEach((c) => {
    if (!document.querySelector(".pj-sec")) return;
    c.hidden = false;
    c.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      c.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      document.querySelectorAll(".pj-sec").forEach((s) => { s.hidden = b.dataset.k !== "all" && s.dataset.kind !== b.dataset.k; });
    });
  });
} catch (e) {}

/* projects page: chips show the projects that contain one kind of work */
try {
  document.querySelectorAll(".pj-all-cards").forEach((grid) => {
    const c = document.querySelector(".pj-chips");
    c.hidden = false;
    /* small link under the chips: opens the contact form with the service that matches the chosen kind of work */
    const ord = document.getElementById("pjOrder"), SV = { design: ["design", "التصميم والهوية"], video: ["design", "الفيديو"], voice: ["content", "التعليق الصوتي"], write: ["content", "كتابة المحتوى"], strategy: ["growth", "الاستراتيجية والحملات"] };
    const setOrder = (k) => {
      if (!ord) return;
      const v = SV[k];
      ord.hidden = false;
      ord.firstChild.nodeValue = v ? "اطلب هذه الخدمة " : "اطلب خدمتك ";
      ord.href = v ? "contact.html?svc=" + v[0] + "&n=" + encodeURIComponent(v[1]) : "contact.html";
    };
    setOrder("all");
    c.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      c.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      grid.querySelectorAll(".pj-card").forEach((card) => { card.hidden = b.dataset.k !== "all" && !card.dataset.kinds.split(" ").includes(b.dataset.k); });
      setOrder(b.dataset.k);
    });
  });
} catch (e) {}

/* projects page: slideshow of the best projects, moves by itself until the visitor touches it */
try {
  document.querySelectorAll(".pj-show").forEach((sh) => {
    const slides = [...sh.querySelectorAll(".pj-slide")], dots = [...sh.querySelectorAll(".pj-dots button")], ctl = sh.querySelector(".pj-ctl");
    let i = 0, timer = null;
    const show = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("on", k === i));
      dots.forEach((d, k) => (k === i ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current")));
    };
    const stop = () => { clearInterval(timer); timer = null; };
    const play = () => { if (!timer && !matchMedia("(prefers-reduced-motion:reduce)").matches) timer = setInterval(() => show(i + 1), 5500); };
    if (slides.length < 2) return;
    ctl.hidden = false;
    sh.querySelectorAll(".pj-sl-n").forEach((b) => b.addEventListener("click", () => show(i + +b.dataset.d)));
    dots.forEach((d, k) => d.addEventListener("click", () => show(k)));
    sh.addEventListener("mouseenter", stop);
    sh.addEventListener("mouseleave", play);
    sh.addEventListener("focusin", stop);
    sh.addEventListener("focusout", play);
    let x0 = null;
    sh.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    sh.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) show(i + (dx > 0 ? 1 : -1));
    });
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : play()));
    play();
  });
} catch (e) {}
