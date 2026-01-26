import argparse
import sys
from typing import List

import polars as pl


def to_fasta(input_tsv: str, key_column: str, output_fasta: str, final_csv: str | None = None) -> None:
    keys: set[str] | None = None
    if final_csv:
        df_keys = pl.read_csv(final_csv, infer_schema_length=0)
        key_field = None
        if "clonotypeKey" in df_keys.columns:
            key_field = "clonotypeKey"
        elif "scClonotypeKey" in df_keys.columns:
            key_field = "scClonotypeKey"
        elif len(df_keys.columns) > 0:
            key_field = df_keys.columns[0]
        if key_field is None:
            return
        keys = set(df_keys.get_column(key_field).cast(pl.Utf8).fill_null("").to_list())

    df = pl.read_csv(input_tsv, separator="\t", infer_schema_length=0)
    if key_column not in df.columns:
        print(f"Key column '{key_column}' not found in TSV", file=sys.stderr)
        sys.exit(2)

    seq_cols = [c for c in df.columns if c != key_column]
    with open(output_fasta, "w") as out:
        for row in df.select([key_column] + seq_cols).iter_rows(named=True):
            key = (row.get(key_column) or "").strip()
            if not key:
                continue
            if keys is not None and key not in keys:
                continue
            for c in seq_cols:
                seq = (row.get(c) or "").strip()
                if not seq:
                    continue
                out.write(f">{key}|{c}\n{seq}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert assembling feature TSV to FASTA")
    parser.add_argument("--input_tsv", required=True, help="Input TSV: key + one or more sequence columns")
    parser.add_argument("--key_column", required=True, help="Name of the key column (clonotypeKey or scClonotypeKey)")
    parser.add_argument("--output_fasta", required=True, help="Output FASTA file path")
    parser.add_argument("--final_clonotypes_csv", required=False, help="Optional CSV with allowed keys")

    args = parser.parse_args()
    to_fasta(
        input_tsv=args.input_tsv,
        key_column=args.key_column,
        output_fasta=args.output_fasta,
        final_csv=args.final_clonotypes_csv,
    )


if __name__ == "__main__":
    main()
