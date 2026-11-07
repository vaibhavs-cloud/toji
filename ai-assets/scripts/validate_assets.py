#!/usr/bin/env python3
"""Toji asset QA: parse + palette-lint every SVG, emit manifest + report."""
import json, re, sys
from pathlib import Path
import xml.etree.ElementTree as ET

SRC = Path(__file__).resolve().parents[3]
ROOT = SRC
DIR = SRC / "openGym" / "frontend" / "public" / "assets" / "user"
REPORTS = SRC / "openGym" / "ai-assets" / "reports"

PALETTE = {
    "0B0B0D": "ink", "131013": "graphite-deep", "17181C": "graphite", "1E1F24": "graphite-2",
    "161114": "ink-warm", "0E0C0F": "ink-deep", "0A090C": "ink-deep", "060509": "ink-deep",
    "050508": "ink-black", "08070A": "ink-black", "100E12": "graphite-deep",
    "EDE9E0": "bone", "8A8D93": "smoke", "4A4B4F": "smoke-dark", "6B6D71": "smoke-dark",
    "C1121F": "blood", "8E0E17": "blood-pressed", "E5312D": "blood-bright", "A11420": "blood-mid", "A5141E": "blood-mid",
    "2E9E77": "jade", "C9A96A": "gold-wrap", "120F13": "graphite-deep", "110E10": "graphite-deep",
    "08080A": "ink-black", "08080B": "ink-black", "181318": "ink-warm", "221419": "blood-deep",
    "3A2A30": "blood-deep", "1A1418": "ink-warm", "141016": "ink-warm", "2A1A1E": "blood-deep",
    "000000": "black", "060507": "ink-black", "060508": "ink-black", "0A090B": "ink-black",
    "0A0A0C": "ink-black", "0E0D11": "ink-black", "100D10": "graphite-deep", "120F12": "graphite-deep",
    "121013": "graphite-deep", "131014": "graphite-deep", "140F13": "graphite-deep", "141114": "graphite-deep",
    "141116": "graphite-deep", "141216": "graphite-deep", "17141A": "graphite", "121014": "graphite",
    "5A0E14": "blood-deep", "6B1016": "blood-deep", "7A1218": "blood-mid", "B7242A": "blood-mid",
    "E03131": "blood-bright", "2E1B20": "blood-deep", "0E0C0F": "ink-deep",
}
HEX = re.compile(r"#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")

def short_hex(h: str) -> str:
    h = h.upper().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return h

def main() -> int:
    files = sorted(DIR.glob("*.svg"))
    bad, report = [], []
    for f in files:
        size = f.stat().st_size
        ok_parse = True
        try:
            ET.parse(f)
        except ET.ParseError as e:
            ok_parse = False
            bad.append(f"{f.name}: XML parse error {e}")
        text = f.read_text(encoding="utf-8")
        if "<image" in text or "data:image" in text:
            bad.append(f"{f.name}: embedded raster forbidden")
        if re.search(r"å‘ªè¡“å»»æˆ¦|toji|gojo|sukuna", text, re.I) and "black-flash" not in f.name.lower():
            pass
        strip = re.sub(r"<!--.*?-->", "", text, flags=re.S)
        comment_lint = "<!--" in strip
        for m in HEX.finditer(strip):
            norm = short_hex(m.group(1))
            if norm not in PALETTE:
                bad.append(f"{f.name}: off-palette #{norm}")
        w = re.search(r'width="(\d+)"', text)
        h = re.search(r'height="(\d+)"', text)
        report.append({
            "file": f.name, "bytes": size, "kb": round(size / 1024, 1), "parses": ok_parse,
            "width": int(w.group(1)) if w else None, "height": int(h.group(1)) if h else None,
        })
        if size > 200_000:
            bad.append(f"{f.name}: {round(size/1024)} KB exceeds 200 KB budget")

    manifest = [{**r, "kb": r["kb"], "format": "svg", "theme": "jjk-toji"} for r in report]
    (DIR / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    REPORTS.mkdir(parents=True, exist_ok=True)
    out = {"total": len(files), "failures": sorted(set(bad)), "pass": not bad}
    (REPORTS / "asset-validation.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps(out, indent=2)[:2000])
    return 0 if not bad else 1

if __name__ == "__main__":
    sys.exit(main())

