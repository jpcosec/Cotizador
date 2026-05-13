#!/usr/bin/env python3
import argparse
import csv
import re
from pathlib import Path


def clean(s):
    return re.sub(r"\s+", " ", (s or "")).strip()


def normalize_day(day):
    d = clean(day)
    if not d:
        return ""
    m = re.match(r"dia\s*0*(\d+)$", d.lower())
    if m:
        return f"Día {int(m.group(1))}"
    if d.lower() == "por el dia":
        return "Por el Día"
    return d


def parse_int_like(value):
    v = clean(value)
    if not v:
        return None
    if re.search(r"[A-Za-z]", v):
        return None
    v = v.replace("$", "")

    if re.fullmatch(r"\d{1,3}(?:\.\d{3})+(?:,\d+)?", v):
        v = v.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"\d{1,3}(?:,\d{3})+(?:\.\d+)?", v):
        v = v.replace(",", "")
    else:
        v = v.replace(",", ".")
    try:
        return int(round(float(v)))
    except Exception:
        return None


def format_clp(value):
    n = parse_int_like(value)
    if n is None:
        return clean(value)
    return f"${n:,}"


def main():
    parser = argparse.ArgumentParser(
        description="Export cotizaciones into a standard table shape with client metadata columns."
    )
    parser.add_argument("--in-csv", default="output/cotizaciones_big.csv")
    parser.add_argument("--out-csv", default="output/cotizaciones_template.csv")
    parser.add_argument(
        "--include-summary",
        action="store_true",
        help="Include summary lines (e.g., Total paquete).",
    )
    args = parser.parse_args()

    in_path = Path(args.in_csv)
    out_path = Path(args.out_csv)
    if not in_path.exists():
        raise SystemExit(f"Input not found: {in_path}")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    out_fields = [
        "Archivo",
        "Nombre",
        "Empresa",
        "E Mail",
        "Fono",
        "Fecha",
        "Nº Pasajeros",
        "Atiende",
        "Telefono",
        "Día",
        "Servicio",
        "Hora",
        "Uds",
        "Nº Pax",
        "Valor",
        "Total",
        "Detalle de servicios",
    ]

    written = 0
    with in_path.open(encoding="utf-8") as inf, out_path.open("w", encoding="utf-8", newline="") as outf:
        reader = csv.DictReader(inf)
        writer = csv.DictWriter(outf, fieldnames=out_fields)
        writer.writeheader()

        for r in reader:
            if r.get("status") != "ok":
                continue
            if r.get("row_kind") == "summary" and not args.include_summary:
                continue

            telefono = clean(r.get("client_phone", ""))
            fono = clean(r.get("client_phone", ""))

            row = {
                "Archivo": clean(r.get("path", "")),
                "Nombre": clean(r.get("client_name", "")),
                "Empresa": clean(r.get("client_company", "")),
                "E Mail": clean(r.get("client_email", "")),
                "Fono": fono,
                "Fecha": clean(r.get("client_date", "")),
                "Nº Pasajeros": clean(r.get("client_pax", "")),
                "Atiende": clean(r.get("client_attendee", "")),
                "Telefono": telefono,
                "Día": normalize_day(r.get("day_section", "")),
                "Servicio": clean(r.get("service", "")),
                "Hora": clean(r.get("hora", "")),
                "Uds": clean(r.get("uds", "")),
                "Nº Pax": clean(r.get("pax", "")),
                "Valor": format_clp(r.get("valor", "")),
                "Total": format_clp(r.get("total", "")),
                "Detalle de servicios": clean(r.get("detalle", "")),
            }
            writer.writerow(row)
            written += 1

    print(f"Wrote: {out_path}")
    print(f"Rows: {written}")


if __name__ == "__main__":
    main()
