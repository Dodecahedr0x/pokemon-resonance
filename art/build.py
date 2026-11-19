#!/usr/bin/env python3
"""Turn art/raw/*.png into shippable public/img/*.webp (resize, seamless textures)."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

ART = Path(__file__).resolve().parent
RAW, OUT = ART / 'raw', ART.parent / 'public' / 'img'

def seamless(im):
    a = np.asarray(im, dtype=np.float32)
    h, w = a.shape[:2]
    s = np.roll(a, (h // 2, w // 2), axis=(0, 1))   # borders of s wrap continuously
    tx = 1 - np.abs(np.linspace(-1, 1, w)); ty = 1 - np.abs(np.linspace(-1, 1, h))
    m = np.clip(np.outer(ty, tx) * 2.2, 0, 1)[..., None]  # 1 in the centre, 0 at edges
    return Image.fromarray((a * m + s * (1 - m)).astype(np.uint8))

def main():
    man = json.loads((ART / 'manifest.json').read_text())
    OUT.mkdir(exist_ok=True)
    for a in man['assets']:
        src = RAW / (a['id'] + '.png')
        if not src.exists():
            continue
        k = man['kinds'][a['kind']]
        im = Image.open(src).convert('RGB')
        if a['kind'] == 'texture':
            side = min(im.size); l = (im.width - side) // 2; t = (im.height - side) // 2
            im = im.crop((l, t, l + side, t + side)).resize((k['size'], k['size']), Image.LANCZOS)
            if k.get('seamless'):
                im = seamless(im)
        elif im.width > k['size']:
            im = im.resize((k['size'], round(im.height * k['size'] / im.width)), Image.LANCZOS)
        dst = OUT / (a['id'] + '.webp')
        im.save(dst, 'WEBP', quality=78, method=6)
        print(f"{a['id']:16} {im.size[0]}x{im.size[1]} {dst.stat().st_size // 1024} KB")

if __name__ == '__main__':
    main()
