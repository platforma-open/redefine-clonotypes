import argparse
import os
import re
from typing import Dict, List, Optional, Tuple

import polars as pl

REGIONS = ["FR1", "CDR1", "FR2", "CDR2", "FR3", "CDR3", "FR4"]

REGION_RANGES = {
    "imgt": {
        "H": {
            "FR1": (1, 26),
            "CDR1": (27, 38),
            "FR2": (39, 55),
            "CDR2": (56, 65),
            "FR3": (66, 104),
            "CDR3": (105, 117),
            "FR4": (118, 129),
        },
        "KL": {
            "FR1": (1, 26),
            "CDR1": (27, 38),
            "FR2": (39, 55),
            "CDR2": (56, 65),
            "FR3": (66, 104),
            "CDR3": (105, 117),
            "FR4": (118, 129),
        },
    },
    "kabat": {
        "H": {
            "FR1": (1, 30),
            "CDR1": (31, 35),
            "FR2": (36, 49),
            "CDR2": (50, 65),
            "FR3": (66, 94),
            "CDR3": (95, 102),
            "FR4": (103, 113),
        },
        "KL": {
            "FR1": (1, 23),
            "CDR1": (24, 34),
            "FR2": (35, 49),
            "CDR2": (50, 56),
            "FR3": (57, 88),
            "CDR3": (89, 97),
            "FR4": (98, 107),
        },
    },
    "chothia": {
        "H": {
            "FR1": (1, 25),
            "CDR1": (26, 32),
            "FR2": (33, 52),
            "CDR2": (53, 55),
            "FR3": (56, 94),
            "CDR3": (95, 102),
            "FR4": (103, 113),
        },
        "KL": {
            "FR1": (1, 23),
            "CDR1": (24, 34),
            "FR2": (35, 49),
            "CDR2": (50, 56),
            "FR3": (57, 88),
            "CDR3": (89, 97),
            "FR4": (98, 107),
        },
    },
}


def parse_positions(fields: List[str]) -> List[str]:
    start_idx = None
    for i, f in enumerate(fields):
        if re.match(r"^\d", f):
            start_idx = i
            break
    if start_idx is None:
        return []
    return fields[start_idx:]


def load_anarci_csv(path: Optional[str]) -> Tuple[Dict[str, List[str]], List[str]]:
    if not path or not os.path.exists(path):
        return {}, []
    df = pl.read_csv(path, infer_schema_length=0)
    fields = df.columns
    positions = parse_positions(fields)
    rows: Dict[str, List[str]] = {}
    if "Id" not in df.columns or len(positions) == 0:
        return rows, positions
    df = df.select(["Id"] + positions)
    for row in df.iter_rows(named=True):
        row_id = (row.get("Id") or "").strip()
        if not row_id:
            continue
        key, _, _ = row_id.partition("|")
        residues = [(row.get(p) or "").strip() for p in positions]
        if key and key not in rows:
            rows[key] = residues
    return rows, positions


def position_number(label: str) -> Optional[int]:
    m = re.match(r"^(\d+)", label)
    if not m:
        return None
    return int(m.group(1))


def region_for_pos(num: int, ranges: Dict[str, Tuple[int, int]]) -> Optional[str]:
    for region in REGIONS:
        start, end = ranges[region]
        if start <= num <= end:
            return region
    return None


def build_regions(
    pos_labels: List[str],
    residues: List[str],
    nt_seq: str,
    ranges: Dict[str, Tuple[int, int]],
) -> Tuple[Dict[str, str], Dict[str, str]]:
    nt_seq = (nt_seq or "").upper().replace(" ", "")
    aa_regions: Dict[str, List[str]] = {r: [] for r in REGIONS}
    nt_regions: Dict[str, List[str]] = {r: [] for r in REGIONS}
    nt_idx = 0

    for pos_label, residue in zip(pos_labels, residues):
        num = position_number(pos_label)
        residue = (residue or "").strip()
        is_gap = residue == "" or residue == "-" or residue == "."

        nt_triplet = ""
        if not is_gap:
            if nt_idx + 3 <= len(nt_seq):
                nt_triplet = nt_seq[nt_idx:nt_idx + 3]
            nt_idx += 3

        if num is None:
            continue

        region = region_for_pos(num, ranges)
        if region is None:
            continue

        if is_gap:
            continue

        aa_regions[region].append(residue)
        nt_regions[region].append(nt_triplet)

    aa_out = {r: "".join(aa_regions[r]) for r in REGIONS}
    nt_out = {r: "".join(nt_regions[r]) for r in REGIONS}
    return aa_out, nt_out


def read_input_tsv(path: str) -> Tuple[List[str], Dict[str, Dict[str, Dict[str, str]]], List[str]]:
    keys: List[str] = []
    seqs: Dict[str, Dict[str, Dict[str, str]]] = {}
    df = pl.read_csv(path, separator="\t", infer_schema_length=0)
    fields = df.columns
    for row in df.iter_rows(named=True):
        key = (row.get("clonotypeKey") or "").strip()
        if not key:
            continue
        keys.append(key)
        seqs[key] = seqs.get(key, {})
        for chain in ("H", "KL"):
            aa_col = f"vdjRegion_aa_{chain}"
            nt_col = f"vdjRegion_nt_{chain}"
            if aa_col in fields:
                seqs[key].setdefault(chain, {})["aa"] = (row.get(aa_col) or "").strip()
            if nt_col in fields:
                seqs[key].setdefault(chain, {})["nt"] = (row.get(nt_col) or "").strip()
    return keys, seqs, fields


def main() -> None:
    p = argparse.ArgumentParser(description="Build numbering-region TSV from ANARCI outputs")
    p.add_argument("--input_tsv", required=True, help="Input TSV with VDJRegion aa/nt columns")
    p.add_argument("--scheme", required=True, choices=["imgt", "kabat", "chothia"], help="Numbering scheme")
    p.add_argument("--h_csv", required=False, help="Path to H chain ANARCI CSV")
    p.add_argument("--kl_csv", required=False, help="Path to KL chain ANARCI CSV")
    p.add_argument("--out_tsv", required=True, help="Output TSV path")
    args = p.parse_args()

    keys, seqs, fields = read_input_tsv(args.input_tsv)
    has_h = "vdjRegion_aa_H" in fields
    has_kl = "vdjRegion_aa_KL" in fields
    chains = [c for c in ("H", "KL") if (c == "H" and has_h) or (c == "KL" and has_kl)]

    anarci_h, pos_h = load_anarci_csv(args.h_csv)
    anarci_kl, pos_kl = load_anarci_csv(args.kl_csv)
    anarci_by_chain = {"H": (anarci_h, pos_h), "KL": (anarci_kl, pos_kl)}

    cols = ["clonotypeKey"]
    for chain in chains:
        for region in REGIONS:
            cols.append(f"{args.scheme}_{region}_aa_{chain}")
            cols.append(f"{args.scheme}_{region}_nt_{chain}")

    data: List[List[str]] = []
    for key in keys:
        row: List[str] = [key]
        for chain in chains:
            anarci_rows, pos_labels = anarci_by_chain[chain]
            residues = None
            if anarci_rows and pos_labels:
                residues = anarci_rows.get(key)

            if residues is None:
                row.extend([""] * (len(REGIONS) * 2))
                continue

            nt_seq = seqs.get(key, {}).get(chain, {}).get("nt", "")
            ranges = REGION_RANGES[args.scheme][chain]
            aa_regions, nt_regions = build_regions(pos_labels, residues, nt_seq, ranges)
            for region in REGIONS:
                row.append(aa_regions.get(region, ""))
                row.append(nt_regions.get(region, ""))
        data.append(row)

    pl.DataFrame(data, schema=cols).write_csv(args.out_tsv, separator="\t")


if __name__ == "__main__":
    main()
