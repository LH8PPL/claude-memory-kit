#!/usr/bin/env python3
"""Dump Python cmk_canonicalize outputs for every fixture vector as a single
JSON document (sorted, deterministic). Pair with parity-dump-node.mjs and
compare the two outputs byte-for-byte to prove Node ≡ Python parity.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "python"))

from cmk_canonicalize import canonicalize, generate_id

FIXTURE_PATH = REPO_ROOT / "fixtures" / "canonicalize-vectors.json"


def main() -> None:
    out_path = (
        Path(sys.argv[1]) if len(sys.argv) > 1 else REPO_ROOT / "tmp-parity-python.json"
    )
    fixture = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    rows = [
        {
            "name": v["name"],
            "canonical": canonicalize(v["input"]),
            "id_p": generate_id("P", v["input"]),
            "id_u": generate_id("U", v["input"]),
            "id_l": generate_id("L", v["input"]),
        }
        for v in fixture["vectors"]
    ]
    payload = {"impl": "python", "rows": rows}
    out_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} rows to {out_path}")


if __name__ == "__main__":
    main()
