"""Parity tests for cmk_canonicalize. Drives every assertion off
fixtures/canonicalize-vectors.json so the Python implementation is held to the
same byte-level contract as the Node @cmk/canonicalize package.
"""

from __future__ import annotations

import json
import random
import re
from pathlib import Path

import pytest
from cmk_canonicalize import (
    BASE32_ALPHABET,
    canonicalize,
    encode_base32,
    generate_id,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_PATH = REPO_ROOT / "fixtures" / "canonicalize-vectors.json"
AMBIGUOUS_CHARS = ["0", "O", "1", "l", "I", "8"]


@pytest.fixture(scope="session")
def fixture() -> dict:
    return json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def vectors(fixture: dict) -> list[dict]:
    return fixture["vectors"]


def _vector_ids(vectors: list[dict]) -> list[str]:
    return [v["name"] for v in vectors]


def test_fixture_has_at_least_30_vectors(vectors: list[dict]) -> None:
    assert len(vectors) >= 30


def test_fixture_vector_names_are_unique(vectors: list[dict]) -> None:
    names = [v["name"] for v in vectors]
    assert len(set(names)) == len(names)


def _load_vectors() -> list[dict]:
    return json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))["vectors"]


_FIXTURE_VECTORS = _load_vectors()
_FIXTURE_IDS = [v["name"] for v in _FIXTURE_VECTORS]


@pytest.mark.parametrize("vector", _FIXTURE_VECTORS, ids=_FIXTURE_IDS)
def test_canonicalize_matches_expected_for_vector(vector: dict) -> None:
    assert canonicalize(vector["input"]) == vector["expected_canonical"]


@pytest.mark.parametrize("vector", _FIXTURE_VECTORS, ids=_FIXTURE_IDS)
def test_generate_id_matches_expected_for_vector(vector: dict) -> None:
    assert generate_id("P", vector["input"]) == vector["expected_id_P"]


def test_backref_idempotency_single_prefix() -> None:
    base = "we standardized on python 3.13"
    with_backref = f"(P-A8FN3MQ2) {base}"
    assert generate_id("P", with_backref) == generate_id("P", base)


@pytest.mark.parametrize("prefix", ["P", "U", "L"])
def test_backref_idempotency_all_prefixes(prefix: str) -> None:
    base = "milvus is pinned at v2.6.16"
    backref = f"({prefix}-AAAAAAAA) {base}"
    assert generate_id("P", backref) == generate_id("P", base)


def test_tier_prefix_only_affects_id_prefix_not_hash() -> None:
    text = "shared canonical body"
    p_id = generate_id("P", text)
    u_id = generate_id("U", text)
    l_id = generate_id("L", text)
    assert p_id[2:] == u_id[2:] == l_id[2:]
    assert p_id.startswith("P-")
    assert u_id.startswith("U-")
    assert l_id.startswith("L-")


@pytest.mark.parametrize("bad_tier", ["X", "", "p", "PP", None])
def test_invalid_tier_raises(bad_tier) -> None:
    with pytest.raises(ValueError, match="Invalid tier"):
        generate_id(bad_tier, "anything")


class TestBase32Alphabet:
    def test_exactly_32_chars(self) -> None:
        assert len(BASE32_ALPHABET) == 32

    @pytest.mark.parametrize("ambiguous", AMBIGUOUS_CHARS)
    def test_excludes_ambiguous(self, ambiguous: str) -> None:
        assert ambiguous not in BASE32_ALPHABET

    def test_chars_are_unique(self) -> None:
        assert len(set(BASE32_ALPHABET)) == len(BASE32_ALPHABET)

    def test_1000_random_encodings_contain_no_ambiguous_chars(self) -> None:
        rng = random.Random(42)
        for i in range(1000):
            text = f"random-input-{rng.random()}-{i}"
            body = generate_id("P", text)[2:]
            for c in AMBIGUOUS_CHARS:
                assert c not in body, (
                    f"Ambiguous char {c!r} appeared in ID body {body!r} "
                    f"for input {text!r}"
                )

    def test_encode_base32_eight_zero_bytes_yields_thirteen_chars(self) -> None:
        out = encode_base32(b"\x00" * 8)
        assert len(out) == 13

    def test_encode_base32_thirtytwo_zero_bytes_yields_52_chars_of_alphabet_zero(
        self,
    ) -> None:
        out = encode_base32(b"\x00" * 32)
        assert len(out) == 52
        assert out == BASE32_ALPHABET[0] * 52


class TestCanonicalizeEdgeCases:
    def test_none_returns_empty_string(self) -> None:
        assert canonicalize(None) == ""

    @pytest.mark.parametrize("vector", _FIXTURE_VECTORS, ids=_FIXTURE_IDS)
    def test_canonicalize_is_idempotent(self, vector: dict) -> None:
        once = canonicalize(vector["input"])
        twice = canonicalize(once)
        assert twice == once

    def test_generate_id_is_deterministic(self) -> None:
        assert generate_id("P", "deterministic input") == generate_id(
            "P", "deterministic input"
        )

    def test_generate_id_matches_documented_format(self) -> None:
        id_value = generate_id("P", "deterministic input")
        pattern = re.compile(r"^P-[2345679ABCDEFGHJKLMNPQRSTUVWXYZa]{8}$")
        assert pattern.match(id_value) is not None
