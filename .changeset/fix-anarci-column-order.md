---
'@platforma-open/milaboratories.redefine-clonotypes.anarci-numbering': patch
'@platforma-open/milaboratories.redefine-clonotypes.workflow': patch
'@platforma-open/milaboratories.redefine-clonotypes': patch
---

Rebuild ANARCI's numbering column order before assembling regions.

ANARCI orders its CSV header by insertion ranks pooled across the whole file. A
sequence carrying a deletion beside an insertion slot leaves two positions
sharing a rank, and that tie is broken by `set` iteration order, which Python
randomises per process. The numbering script consumed the header positionally,
so one such sequence reordered residues within a region for every sequence in
the sample, differently on each run. Kabat and Chothia place 82A/82B/82C inside
FR3, so the visible symptom was a scrambled framework.

Insertion direction is taken from the scheme rather than inferred from the
header, since the header is the corrupted input: IMGT indices 33, 61 and 112
count down (112J ... 112A, 112) while Kabat and Chothia only count up.
