---
'@platforma-open/milaboratories.redefine-clonotypes.model': minor
'@platforma-open/milaboratories.redefine-clonotypes.ui': minor
'@platforma-open/milaboratories.redefine-clonotypes': minor
'@platforma-open/milaboratories.redefine-clonotypes.workflow': patch
---

Migrate the model to BlockModelV3 and add the mandatory block kind, alongside the structurer migration and full SDK upgrade (block-tools 2.14.3, tengo-builder 4.0.23, model 1.83.0).

The persisted shape is unchanged: a legacy upgrader lifts V1 `args` field-for-field into the unified `data`. UI bindings move to `app.model.data`. The kind's init-params contract is the clonotyping run, the chains, the clonotype definition, the numbering scheme, the block subtitle and the resource knobs, so a project template can seed a configured Redefine Clonotypes block.
