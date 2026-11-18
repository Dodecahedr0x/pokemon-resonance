#!/usr/bin/env python3
"""Generate missing raw art with the Codex CLI image tool.
Usage: art/.venv/bin/python art/gen.py [--batch N] [--only id,id] [-j 3]"""
import argparse, json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ART = Path(__file__).resolve().parent
RAW = ART / 'raw'
REF = ART / 'ref-title.jpg'

def prompt_for(man, a):
    k = man['kinds'][a['kind']]
    return (f"Use your image generation tool to create exactly ONE image, aspect ratio {k['aspect']}. "
            f"{man['style']} {k['brief']} Subject: {a['prompt']} "
            f"When the image is generated, copy the PNG file to {RAW / (a['id'] + '.png')} and reply with that path only. "
            "Do not edit any other file.")

def gen(man, a):
    out = RAW / (a['id'] + '.png')
    cmd = ['codex', 'exec', '--skip-git-repo-check', '-s', 'workspace-write', '-C', str(RAW),
           '-i', str(REF)]
    r = subprocess.run(cmd, input=prompt_for(man, a), capture_output=True, text=True, timeout=600)
    ok = out.exists() and out.stat().st_size > 10000
    print(('OK  ' if ok else 'FAIL'), a['id'], '' if ok else r.stdout[-400:] + r.stderr[-400:], flush=True)
    return ok

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--batch', type=int)
    p.add_argument('--only')
    p.add_argument('--force', action='store_true')
    p.add_argument('-j', type=int, default=3)
    o = p.parse_args()
    man = json.loads((ART / 'manifest.json').read_text())
    RAW.mkdir(exist_ok=True)
    todo = [a for a in man['assets']
            if (o.batch is None or a['batch'] == o.batch)
            and (not o.only or a['id'] in o.only.split(','))
            and (o.force or not (RAW / (a['id'] + '.png')).exists())]
    print('generating', [a['id'] for a in todo], flush=True)
    with ThreadPoolExecutor(o.j) as ex:
        res = list(ex.map(lambda a: gen(man, a), todo))
    sys.exit(0 if all(res) else 1)

if __name__ == '__main__':
    main()
