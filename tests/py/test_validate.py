"""Pydantic-side validation: every fixture must load cleanly into the
generated v1 model. Counterpart to tests/ts/validate-fixtures.test.mjs."""
from __future__ import annotations

import json
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parent.parent.parent
FIXTURE_DIR = ROOT / "fixtures"


@pytest.fixture(scope="module")
def stiq_design_model():
    """Import the generated Pydantic model. Skip if codegen hasn't run
    (so a fresh clone can run `pytest tests/py/` with a hint, not a
    cryptic ImportError)."""
    try:
        from stiq_design_schema import StiqDesign  # type: ignore[attr-defined]
    except ImportError as e:
        pytest.skip(
            f"generated model not present (run `python codegen/py.py` first): {e}"
        )
    return StiqDesign


@pytest.mark.parametrize(
    "fixture_path",
    sorted(FIXTURE_DIR.glob("*.json")),
    ids=lambda p: p.name,
)
def test_fixture_loads_into_model(stiq_design_model, fixture_path: Path) -> None:
    data = json.loads(fixture_path.read_text())
    doc = stiq_design_model.model_validate(data)
    # Round-trip: dumped doc validates again. Catches default-value drift.
    redump = doc.model_dump(mode="json", exclude_none=True)
    stiq_design_model.model_validate(redump)
