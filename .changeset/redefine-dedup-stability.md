---
'@platforma-open/milaboratories.redefine-clonotypes.workflow': patch
---

Improve re-run deduplication. Stabilize property/abundance column ordering so the property→pframe import and the pt command spec are reproducible across runs. Cache the TSV exporters (input cache) and the main pt computation's output fields so re-runs recover results instead of recomputing the heavy joins/aggregations/hashing.
