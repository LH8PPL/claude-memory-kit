"""cmk-canonicalize — deterministic text canonicalization + content-addressed ID generation.

Python parallel to the Node @cmk/canonicalize package. Byte-identical output against
fixtures/canonicalize-vectors.json. Used by Layer 4+ Python scripts (cron, auto-extract).

Public API:
    canonicalize(text) -> str
    generate_id(tier, text) -> str
    encode_base32(data) -> str
    BASE32_ALPHABET: str
"""

from __future__ import annotations

import hashlib
import re

__all__ = ["BASE32_ALPHABET", "canonicalize", "encode_base32", "generate_id"]

BASE32_ALPHABET: str = "2345679ABCDEFGHJKLMNPQRSTUVWXYZa"

_VALID_TIERS: frozenset[str] = frozenset({"U", "P", "L"})

# Task 257 (D-403/D-404) — U+FEFF must fold as WHITESPACE, matching Node.
#
# JavaScript's `\s` includes U+FEFF (ECMA-262 folds <ZWNBSP> into the WhiteSpace
# production), so the Node twin has always absorbed a byte-order mark wherever
# `\s` appears. Python's `re` `\s` does NOT match U+FEFF (it is category `Cf`,
# not whitespace, in the Unicode database Python follows), so the two
# implementations derived DIFFERENT ids for BOM-prefixed input — a silent
# cross-implementation id fork the parity harness never caught, because no
# vector carried a BOM. Node is the reference implementation and its
# BOM-insensitivity is shipped behavior, so Python moves to match it.
#
# WHY FOLD-AS-WHITESPACE RATHER THAN A LEADING STRIP: Node does not special-case
# the *leading* position — it treats U+FEFF as whitespace in EVERY `\s`, so a
# strip-the-first-BOM shim would still diverge on three real shapes (the BOM is
# written <BOM> below; a literal U+FEFF in source is invisible to a reviewer):
#     "foo<BOM>bar"   Node -> "foo bar"   leading-strip -> "foo<BOM>bar"
#     "hello<BOM>"    Node -> "hello"     leading-strip -> "hello<BOM>"
#     "-<BOM>hello"   Node -> "hello"     leading-strip -> "-<BOM>hello"
# Only folding keeps ALL other behavior identical, which is the actual contract.
#
# WHERE IT IS NEEDED — exactly the two stages a BOM can still reach:
#   * the bullet marker (step 3) runs BEFORE the collapse, so it needs the fold
#     to strip "-<BOM>x" the way Node's `[-*+]\s+` does;
#   * the whitespace collapse (step 4) is the fold itself.
# `str.strip()` (step 5) and `_RE_TRAILING_PUNCT_WS` (step 7) are deliberately
# LEFT ALONE: step 4 has already turned every U+FEFF in the string into a plain
# space, so no BOM can reach them. Widening those too would be a provable no-op,
# and a no-op edit to a byte-exact cross-implementation contract is noise.
#
# RESIDUAL, PRE-EXISTING, NOT TOUCHED HERE: the two `\s` classes still disagree
# in the OTHER direction — Python's `\s` matches U+001C-U+001F and U+0085 (NEL),
# JavaScript's does not. No vector covers those either. Measured and reported
# rather than silently widened: that is a contract change, not an implementation
# detail, and this task's ruling is scoped to the BOM.
_WS = r"[\s\ufeff]"  # JS `\s` == Python `\s` + U+FEFF (see the parity note above)

_RE_HTML_COMMENT = re.compile(r"<!--.*?-->", re.DOTALL)
_RE_BACKREF = re.compile(r"\(([PUL])-[A-Za-z0-9]{8}\)")
_RE_BULLET_MARKER = re.compile(rf"^{_WS}*[-*+]{_WS}+")
_RE_WHITESPACE = re.compile(rf"{_WS}+")
_RE_TRAILING_PUNCT_WS = re.compile(r"[\s.,;]+$")


def canonicalize(text: str | None) -> str:
    """Return the canonical form of *text* per design §3.2.

    Steps (deterministic, mirrors the Node implementation byte-for-byte):
        1. Strip HTML comments (<!--...-->)
        2. Strip citation backrefs ((P|U|L)-XXXXXXXX)
        3. Strip leading bullet marker (tolerates leading whitespace)
        4. Collapse whitespace runs to single space
        5. Trim leading/trailing whitespace
        6. ASCII lowercase (non-ASCII passthrough)
        7. Strip trailing punctuation (., ,, ;) and any preceding whitespace

    "Whitespace" in steps 3-4 means Python's `\\s` PLUS U+FEFF, so a byte-order
    mark folds exactly as it does under JavaScript's `\\s` (Task 257 / D-404).
    """
    if text is None:
        return ""
    s = str(text)
    s = _RE_HTML_COMMENT.sub("", s)
    s = _RE_BACKREF.sub("", s)
    s = _RE_BULLET_MARKER.sub("", s)
    s = _RE_WHITESPACE.sub(" ", s)
    s = s.strip()
    s = "".join(c.lower() if "A" <= c <= "Z" else c for c in s)
    s = _RE_TRAILING_PUNCT_WS.sub("", s)
    return s


def encode_base32(data: bytes) -> str:
    """Encode *data* using the kit's custom 32-char alphabet (5 bits per char, MSB-first)."""
    bits = 0
    value = 0
    out: list[str] = []
    for b in data:
        value = (value << 8) | b
        bits += 8
        while bits >= 5:
            out.append(BASE32_ALPHABET[(value >> (bits - 5)) & 0x1F])
            bits -= 5
    if bits > 0:
        out.append(BASE32_ALPHABET[(value << (5 - bits)) & 0x1F])
    return "".join(out)


def generate_id(tier: str, text: str | None) -> str:
    """Return ``<tier>-<8-char-hash>`` for *text* per design §3.1.

    Raises ValueError if *tier* is not one of 'U', 'P', 'L'.
    """
    if tier not in _VALID_TIERS:
        raise ValueError(f"Invalid tier: {tier!r}. Must be 'U', 'P', or 'L'.")
    canonical = canonicalize(text)
    digest = hashlib.sha256(canonical.encode("utf-8")).digest()
    return f"{tier}-{encode_base32(digest)[:8]}"
