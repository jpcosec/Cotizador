#!/usr/bin/env python3
"""Compare current and desired component/view-stage matrices."""

from __future__ import annotations

from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parent
CURRENT = ROOT / "component-view-stage-matrix.yaml"
DESIRED = ROOT / "component-view-stage-matrix-desired.yaml"
TARGET = ROOT / "component-view-stage-matrix-diff.md"


def flatten(components, parent=None):
    rows = {}
    for component in components:
        key = f"{parent}/{component['name']}" if parent else component["name"]
        rows[key] = component
        rows.update(flatten(component.get("children", []), key))
    return rows


def stage_set(component):
    result = set()
    for view_id, stages in component.get("stages", {}).items():
        for stage in stages:
            result.add(f"{view_id}:{stage}")
    return result


def main():
    current = yaml.safe_load(CURRENT.read_text())
    desired = yaml.safe_load(DESIRED.read_text())
    current_rows = flatten(current["components"])
    desired_rows = flatten(desired["components"])
    all_keys = sorted(set(current_rows) | set(desired_rows))

    missing_in_current = []
    extra_in_current = []
    changed = []

    for key in all_keys:
        c = current_rows.get(key)
        d = desired_rows.get(key)
        if c is None:
            missing_in_current.append(key)
            continue
        if d is None:
            extra_in_current.append(key)
            continue
        c_stages = stage_set(c)
        d_stages = stage_set(d)
        c_status = c.get("status", "")
        d_status = d.get("status", "")
        if c_stages != d_stages or c_status != d_status:
            changed.append(
                (key, c_status, d_status, sorted(c_stages), sorted(d_stages))
            )

    lines = [
        "# Component x View-Stage Matrix Diff",
        "",
        "Generated from:",
        "- `component-view-stage-matrix.yaml`",
        "- `component-view-stage-matrix-desired.yaml`",
        "",
    ]

    lines.append("## Missing In Current")
    lines.append("")
    if missing_in_current:
        lines.extend([f"- `{key}`" for key in missing_in_current])
    else:
        lines.append("- None")
    lines.append("")

    lines.append("## Extra In Current")
    lines.append("")
    if extra_in_current:
        lines.extend([f"- `{key}`" for key in extra_in_current])
    else:
        lines.append("- None")
    lines.append("")

    lines.append("## Changed")
    lines.append("")
    if changed:
        for key, c_status, d_status, c_stages, d_stages in changed:
            lines.append(f"### `{key}`")
            lines.append("")
            lines.append(f"- current status: `{c_status or 'n/a'}`")
            lines.append(f"- desired status: `{d_status or 'n/a'}`")
            lines.append(f"- current stages: `{', '.join(c_stages) or 'none'}`")
            lines.append(f"- desired stages: `{', '.join(d_stages) or 'none'}`")
            lines.append("")
    else:
        lines.append("- None")
        lines.append("")

    TARGET.write_text("\n".join(lines))
    print(f"Generated {TARGET}")


if __name__ == "__main__":
    main()
