# Vistas Parallel Design Graph
<!-- This was craeted without considering the info of claps_codelab, there are definitions and implementations that might be already made there. -->
Date: 2026-03-11

## Purpose

Show parallel design paths to reach full `Vistas.md` parity, including
dependency gates and join points.

## Graph (dependency + parallelism)

```mermaid
flowchart LR
  V[Vistas target parity]

  subgraph P0[Path 0 - AppFlow parity]
    A1[Home parity: new/load/editors]
    A2[Client create/edit in flow]
    A3[Load previous with real filters + preview]
    A1 --> A2 --> A3
  end

  subgraph P1[Path 1 - Core editor UX]
    B1[Timeline domain model]
    B2[Drag move on schedule]
    B3[Drag resize duration]
    B4[Group aware copy/duplicate semantics]
    B1 --> B2 --> B3 --> B4
  end

  subgraph P2[Path 2 - Kit and group runtime]
    C1[Kit/group contract from COMPOSICION_KIT]
    C2[Kit aware basket/category behavior]
    C3[Pack editor base UI]
    C1 --> C2 --> C3
  end

  subgraph P3[Path 3 - Validation and exports]
    D1[Validation table parity: day/hour/pack ordering]
    D2[Row hover detail UX]
    D3[PDF export adapter]
    D4[Excel export adapter with formulas]
    D1 --> D2 --> D3 --> D4
  end

  subgraph P4[Path 4 - Admin tools]
    E1[DB generic table parity]
    E2[Rules builder + category scope]
    E3[Rules simulator]
    E4[Category and pricing creators]
    E5[Pricing/rules charts]
    E1 --> E2 --> E3
    E1 --> E4 --> E5
  end

  G1{Gate A\nQuote flow complete\nwithout persistence}
  G2{Gate B\nKit aware runtime complete}
  G3{Gate C\nValidation + export complete}
  G4{Gate D\nAdmin suite complete}

  A3 --> G1
  B1 --> G1

  G1 --> B2
  G1 --> C1
  C2 --> G2
  B4 --> G2

  G2 --> D1
  D4 --> G3

  G1 --> E1
  C3 --> E4
  E5 --> G4

  G3 --> V
  G4 --> V
```

## How to run in parallel

1. Start `Path 0` and `Path 4` immediately (low coupling, high unblock value).
2. Start `Path 1` design baseline (`B1`) while `Path 0` closes Gate A.
3. Start `Path 2` as soon as Gate A is closed (kit/group is the main blocker for pack parity).
4. Start `Path 3` after Gate B, so validation/export contracts include pack semantics from day one.

## Recommended workstreams

- `Stream A (Workflow + Screens)`: A1-A3, D1-D2
- `Stream B (Domain + Runtime)`: B1-B4, C1-C2
- `Stream C (Admin + Authoring)`: E1-E5, C3
- `Stream D (Services)`: D3-D4

## Critical path

`A1 -> A2 -> A3 -> G1 -> C1 -> C2 -> G2 -> D1 -> D2 -> D3 -> D4 -> G3 -> parity`

Everything in `Path 4` is strategically important but not on the strict shortest path to user-facing quotation parity.

## Input source

Derived from:

- `docs/plans/2026-03-11-vistas-design-map.md`
- `/home/jp/CotizadorLodge/Vistas.md`
