---
"@platforma-open/milaboratories.redefine-clonotypes.workflow": patch
---

Namespace the redefined clonotype-key axis by a content hash instead of the per-block blockId, and make the encoded definition structure deterministic. `pl7.app/redefined-by` now carries a hash of the (key-sorted) definition structure rather than the blockId, and the definition structure stored in the axis domain is encoded with canonical.encode instead of json.encode. json.encode reordered map keys on every run, which changed the axis identity and re-triggered the Parquet imports keyed on it each run; canonical encoding plus the content tag let identical redefinitions dedupe across blocks/projects while keeping different definitions distinct (the dataset is still distinguished by the cloned original clonotype-key axis domain).
