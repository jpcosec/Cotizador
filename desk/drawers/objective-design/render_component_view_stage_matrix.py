#!/usr/bin/env python3
"""Render a bi-hierarchical component/view-stage matrix from YAML."""

from __future__ import annotations

import sys
from html import escape
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parent
DEFAULT_SOURCE = ROOT / "component-view-stage-matrix.yaml"


def flatten_stage_columns(views):
    columns = []
    for view in views:
        for stage in view["stages"]:
            columns.append(
                {
                    "view_id": view["id"],
                    "view_label": view["label"],
                    "stage_id": stage["id"],
                    "stage_label": stage["label"],
                }
            )
    return columns


def flatten_components(components, depth=0):
    rows = []
    for component in components:
        row = dict(component)
        row["depth"] = depth
        row["children"] = component.get("children", [])
        rows.append(row)
        rows.extend(flatten_components(component.get("children", []), depth + 1))
    return rows


def participates(component, column):
    stages = component.get("stages", {}).get(column["view_id"], [])
    return column["stage_id"] in stages


def build_html(data):
    columns = flatten_stage_columns(data["views"])
    rows = flatten_components(data["components"])
    type_map = data["component_types"]

    top_headers = []
    stage_headers = []
    for view in data["views"]:
        top_headers.append(
            f'<th class="view-group" colspan="{len(view["stages"])}">{escape(view["label"])}</th>'
        )
        for stage in view["stages"]:
            stage_headers.append(f'<th class="stage">{escape(stage["label"])}</th>')

    body_rows = []
    for row in rows:
        color = type_map[row["type"]]["color"]
        label = escape(row["name"])
        if row.get("mode"):
            label += f' <span class="mode">({escape(row["mode"])})</span>'
        status = row.get("status")
        if status:
            label += (
                f' <span class="status status-{escape(status)}">{escape(status)}</span>'
            )
        indent = row["depth"] * 20
        cells = []
        for column in columns:
            if participates(row, column):
                cells.append(
                    f'<td class="hit"><span class="chip" style="--chip:{color}"></span></td>'
                )
            else:
                cells.append('<td class="miss"></td>')
        body_rows.append(
            "<tr>"
            f'<th class="component depth-{row["depth"]}" style="padding-left:{12 + indent}px; --row-color:{color}">{label}</th>'
            + "".join(cells)
            + "</tr>"
        )

    legend_items = []
    for entry in type_map.values():
        legend_items.append(
            f'<li><span class="legend-chip" style="background:{entry["color"]}"></span>{escape(entry["label"])}</li>'
        )

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(data["title"])}</title>
  <style>
    :root {{
      --bg: #fffdf8;
      --paper: #ffffff;
      --grid: #e5dccd;
      --grid-strong: #b9a88e;
      --text: #2b2116;
      --muted: #6e6254;
      --header: #2f2a24;
      --stage-bg: #faf3e4;
      --view-bg: #efe2c7;
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: "Iowan Old Style", "Palatino Linotype", serif; background: var(--bg); color: var(--text); }}
    .page {{ max-width: 1600px; margin: 0 auto; padding: 28px; }}
    h1 {{ margin: 0 0 8px; font-size: 30px; }}
    p {{ margin: 0 0 18px; color: var(--muted); max-width: 900px; line-height: 1.45; }}
    .legend {{ display: flex; gap: 18px; flex-wrap: wrap; list-style: none; padding: 0; margin: 0 0 18px; color: var(--muted); }}
    .legend li {{ display: inline-flex; align-items: center; gap: 8px; }}
    .legend-chip {{ width: 14px; height: 14px; border-radius: 999px; display: inline-block; border: 1px solid rgba(0,0,0,.1); }}
    .table-wrap {{ overflow: auto; background: var(--paper); border: 1px solid var(--grid-strong); box-shadow: 0 18px 45px rgba(43, 33, 22, 0.08); }}
    table {{ width: 100%; border-collapse: collapse; min-width: 1100px; }}
    thead th {{ border: 1px solid var(--grid); }}
    tbody td, tbody th {{ border: 1px solid var(--grid); }}
    .corner {{ min-width: 320px; background: var(--header); color: white; text-align: left; padding: 12px 14px; font-size: 14px; letter-spacing: .05em; text-transform: uppercase; }}
    .view-group {{ background: var(--view-bg); color: var(--text); padding: 10px 0; font-size: 15px; text-transform: uppercase; letter-spacing: .06em; }}
    .stage {{ background: var(--stage-bg); color: var(--muted); padding: 9px 0; font-size: 13px; text-transform: lowercase; }}
    .component {{ text-align: left; white-space: nowrap; min-width: 320px; padding: 10px 12px; position: sticky; left: 0; background: white; z-index: 1; border-right: 1px solid var(--grid-strong); font-size: 15px; }}
    .component::before {{ content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--row-color); }}
    .mode {{ color: var(--muted); font-size: 12px; font-style: italic; }}
    .status {{ margin-left: 8px; font-size: 11px; font-family: ui-monospace, monospace; text-transform: uppercase; letter-spacing: .04em; border-radius: 999px; padding: 2px 7px; vertical-align: middle; }}
    .status-real, .status-strong, .status-target {{ background: #dcfce7; color: #166534; }}
    .status-partial {{ background: #fef3c7; color: #92400e; }}
    .status-regrouped {{ background: #dbeafe; color: #1d4ed8; }}
    .status-split, .status-distributed, .status-overloaded {{ background: #fee2e2; color: #991b1b; }}
    td {{ width: 92px; height: 44px; text-align: center; background: #fffefc; }}
    .hit {{ background: linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.00)); }}
    .chip {{ width: 54px; height: 16px; background: var(--chip); display: inline-block; border-radius: 999px; box-shadow: inset 0 0 0 1px rgba(0,0,0,.08); }}
    .miss {{ background-image: radial-gradient(circle at center, rgba(0,0,0,.03) 0 1px, transparent 1px); background-size: 10px 10px; }}
  </style>
</head>
<body>
  <div class="page">
    <h1>{escape(data["title"])}</h1>
    <p>{escape(data["description"])}</p>
    <ul class="legend">{"".join(legend_items)}</ul>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th class="corner" rowspan="2">Component Hierarchy</th>{"".join(top_headers)}</tr>
          <tr>{"".join(stage_headers)}</tr>
        </thead>
        <tbody>
          {"".join(body_rows)}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
"""


def resolve_paths():
    if len(sys.argv) == 1:
        source = DEFAULT_SOURCE
    else:
        source = Path(sys.argv[1]).resolve()
    if len(sys.argv) >= 3:
        target = Path(sys.argv[2]).resolve()
    else:
        target = source.with_suffix(".html")
    return source, target


def main():
    source, target = resolve_paths()
    data = yaml.safe_load(source.read_text())
    target.write_text(build_html(data))
    print(f"Generated {target}")


if __name__ == "__main__":
    main()
