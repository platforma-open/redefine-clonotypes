import argparse
import json
import os
import re
from typing import Dict, List, Optional, Tuple

import polars as pl

REGIONS = ["FR1", "CDR1", "FR2", "CDR2", "FR3", "CDR3", "FR4"]
CDR_REGIONS = ["CDR1", "CDR2", "CDR3"]

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


def parse_mapping(mapping_raw: Optional[str]) -> Optional[Dict[str, str]]:
    if not mapping_raw:
        return None
    try:
        mapping = json.loads(mapping_raw)
    except json.JSONDecodeError:
        return None
    if not isinstance(mapping, dict):
        return None
    return {str(k): str(v) for k, v in mapping.items()}


def base36_encode(n: int) -> str:
    digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if n == 0:
        return "0"
    s = ""
    while n > 0:
        n, r = divmod(n, 36)
        s = digits[r] + s
    return s


def aligned_sequence(residues: List[str]) -> str:
    aligned = []
    for res in residues:
        res = (res or "").strip()
        aligned.append("-" if res in {"", "-", "."} else res)
    return "".join(aligned)


def cdr_boundaries(
    pos_labels: List[str],
    ranges: Dict[str, Tuple[int, int]],
) -> Dict[str, Optional[Tuple[int, int]]]:
    boundaries: Dict[str, Optional[Tuple[int, int]]] = {r: None for r in CDR_REGIONS}
    for region in CDR_REGIONS:
        start = None
        end = None
        r_start, r_end = ranges[region]
        for idx, label in enumerate(pos_labels):
            num = position_number(label)
            if num is None or num < r_start or num > r_end:
                continue
            if start is None:
                start = idx
            end = idx
        if start is not None and end is not None:
            boundaries[region] = (start, end + 1)  # end is exclusive
    return boundaries


def encode_cdr_annotations(
    aligned: str,
    boundaries: Dict[str, Optional[Tuple[int, int]]],
    mapping: Dict[str, str],
) -> str:
    if not aligned or not mapping:
        return ""
    region_to_code: Dict[str, str] = {}
    for code, label in mapping.items():
        norm = str(label or "").strip().upper()
        if norm in CDR_REGIONS and norm not in region_to_code:
            region_to_code[norm] = str(code)

    segments = []
    seen = set()
    for region in CDR_REGIONS:
        code = region_to_code.get(region)
        bounds = boundaries.get(region)
        if code is None or bounds is None:
            continue
        start_aln, end_aln = bounds
        gaps_before = aligned[:start_aln].count("-")
        gaps_in_range = aligned[start_aln:end_aln].count("-")
        start_ungapped = start_aln - gaps_before
        length_ungapped = (end_aln - start_aln) - gaps_in_range
        if length_ungapped <= 0:
            continue
        key = (code, start_ungapped, length_ungapped)
        if key in seen:
            continue
        seen.add(key)
        segments.append((start_ungapped, f"{code}:{base36_encode(start_ungapped)}+{base36_encode(length_ungapped)}"))

    segments.sort(key=lambda x: x[0])
    return "|".join(seg for _, seg in segments)


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
    p.add_argument("--cdr_mapping_h", required=False, help="CDR annotation mapping JSON for heavy chain")
    p.add_argument("--cdr_mapping_kl", required=False, help="CDR annotation mapping JSON for light chain")
    p.add_argument("--out_tsv", required=True, help="Output TSV path")
    args = p.parse_args()

    keys, seqs, fields = read_input_tsv(args.input_tsv)
    has_h = "vdjRegion_aa_H" in fields
    has_kl = "vdjRegion_aa_KL" in fields
    chains = [c for c in ("H", "KL") if (c == "H" and has_h) or (c == "KL" and has_kl)]

    anarci_h, pos_h = load_anarci_csv(args.h_csv)
    anarci_kl, pos_kl = load_anarci_csv(args.kl_csv)
    anarci_by_chain = {"H": (anarci_h, pos_h), "KL": (anarci_kl, pos_kl)}

    cdr_mapping_by_chain = {
        "H": parse_mapping(args.cdr_mapping_h),
        "KL": parse_mapping(args.cdr_mapping_kl),
    }

    cols = ["clonotypeKey"]
    for chain in chains:
        for region in REGIONS:
            cols.append(f"{args.scheme}_{region}_aa_{chain}")
            cols.append(f"{args.scheme}_{region}_nt_{chain}")
        if cdr_mapping_by_chain.get(chain):
            cols.append(f"cdrs_annotations_{chain}")

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
                if cdr_mapping_by_chain.get(chain):
                    row.append("")
                continue

            nt_seq = seqs.get(key, {}).get(chain, {}).get("nt", "")
            ranges = REGION_RANGES[args.scheme][chain]
            aa_regions, nt_regions = build_regions(pos_labels, residues, nt_seq, ranges)
            for region in REGIONS:
                row.append(aa_regions.get(region, ""))
                row.append(nt_regions.get(region, ""))
            if cdr_mapping_by_chain.get(chain):
                aligned = aligned_sequence(residues)
                boundaries = cdr_boundaries(pos_labels, ranges)
                row.append(encode_cdr_annotations(aligned, boundaries, cdr_mapping_by_chain[chain]))
        data.append(row)

    pl.DataFrame(data, schema=cols).write_csv(args.out_tsv, separator="\t")


if __name__ == "__main__":
    main()
