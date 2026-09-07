---
'@platforma-open/milaboratories.redefine-clonotypes.kind': patch
'@platforma-open/milaboratories.redefine-clonotypes': patch
---

Bump the kind version. The previous release widened the kind's column-id check without bumping it, and the registry refuses that: a kind version's content is immutable, so publishing 1.0.0 with a different `sourceHash` hard-fails and takes the whole block publish with it.
