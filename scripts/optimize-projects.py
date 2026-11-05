"""Turns the raw project files in assets-src/projects/ into web images in assets/projects/.

Every image (and every PDF page) becomes WebP at 640 and 1280 px wide. Output names are
numbered (01-640.webp), so Arabic file names never reach the site. Writes
src/data/projects-manifest.json with the size and source of each image.

Needs Pillow and PyMuPDF (tooling only, not a site dependency):
  python3 -m venv .venv && .venv/bin/pip install pillow pymupdf
  .venv/bin/python scripts/optimize-projects.py
"""
import json, sys
from pathlib import Path
import fitz
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
root = Path(__file__).resolve().parent.parent
src, out = root / "assets-src/projects", root / "assets/projects"
WIDTHS, QUALITY = (640, 1280), 78

def kind(f):
    """image / pdf / other, from the first bytes (some Drive downloads have no extension)"""
    head = f.open("rb").read(12)
    if head[:4] == b"%PDF": return "pdf"
    if head[:4] == b"\x89PNG" or head[:2] == b"\xff\xd8" or head[8:12] == b"WEBP": return "image"
    return "other"

def save(im, folder, n):
    im = im.convert("RGB")
    w, h = im.size
    for tw in WIDTHS:
        if tw > w and tw != WIDTHS[0]:
            continue
        s = im.resize((tw, round(h * tw / w)), Image.LANCZOS) if tw < w else im
        s.save(folder / f"{n:02d}-{tw}.webp", "WEBP", quality=QUALITY, method=6)
    return w, h

def files(d):
    return sorted(p for p in d.rglob("*") if p.is_file() and not p.name.startswith("."))

for old in out.glob("*/[0-9][0-9]-*.webp"):  # keep the compressed videos (video-N.mp4) that live beside the images
    old.unlink()
manifest = {}
for proj in sorted(p for p in src.iterdir() if p.is_dir()):
    folder = out / proj.name
    folder.mkdir(parents=True, exist_ok=True)
    items, n = [], 0
    for f in files(proj):
        k = kind(f)
        if k == "image":
            n += 1
            w, h = save(Image.open(f), folder, n)
            items.append({"n": n, "w": w, "h": h, "from": str(f.relative_to(proj))})
        elif k == "pdf":
            doc = fitz.open(f)
            for pi, page in enumerate(doc):
                n += 1
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
                w, h = save(im, folder, n)
                items.append({"n": n, "w": w, "h": h, "from": f"{f.relative_to(proj)}#p{pi + 1}"})
    manifest[proj.name] = items
    print(proj.name, len(items), "images", file=sys.stderr)

(root / "src/data").mkdir(exist_ok=True)
(root / "src/data/projects-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
