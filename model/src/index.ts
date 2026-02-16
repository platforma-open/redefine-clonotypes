import strings from '@milaboratories/strings';
import type { InferOutputsType, PlRef, SUniversalPColumnId } from '@platforma-sdk/model';
import { BlockModel, isPColumnSpec } from '@platforma-sdk/model';
import { getDefaultBlockLabel } from './label';

export type BlockArgs = {
  defaultBlockLabel: string;
  customBlockLabel: string;
  mixcrRun?: PlRef;
  selectedChains: PlRef[];
  clonotypeDefinition: SUniversalPColumnId[];
  numberingScheme?: 'imgt' | 'kabat' | 'chothia';
};

export const model = BlockModel.create()

  .withArgs<BlockArgs>({
    defaultBlockLabel: getDefaultBlockLabel({ clonotypeDefinitionLabels: [] }),
    customBlockLabel: '',
    selectedChains: [],
    clonotypeDefinition: [],
  })

  .argsValid((ctx) => ctx.args.mixcrRun !== undefined && ctx.args.selectedChains.length > 0 && (ctx.args.clonotypeDefinition?.length ?? 0) > 0)

  .output('mixcrRunOptions', (ctx) =>
    ctx.resultPool.getOptions([
      {
        name: 'mixcr.com/clns', // The main clns file represents the run
        annotations: { 'pl7.app/label': 'MiXCR Clonesets' },
      },
    ], {
      label: { includeNativeLabel: false, forceTraceElements: ['milaboratories.samples-and-data/dataset'] }, // We'll rely on block label from trace if possible, or standard label
    }),
  )

  .output('test', (ctx) => {
    const run = ctx.args.mixcrRun;
    if (run === undefined) return undefined;

    // Get the run ID from the selected clns file
    const runSpec = ctx.resultPool.getSpecByRef(run);
    if (!runSpec) return undefined;

    // The clns file usually has the run ID in its domain
    const runId = runSpec.domain?.['pl7.app/vdj/clonotypingRunId'];
    if (!runId) return undefined;

    // Find all potential chain/isotype tables associated with this run
    return ctx.resultPool.getOptions((spec) => {
      if (!isPColumnSpec(spec)) return false;

      // Check for run ID compatibility
      if (spec.axesSpec[1]?.domain?.['pl7.app/vdj/clonotypingRunId'] !== runId) return false;

      // Check for anchor annotation
      if (spec.annotations?.['pl7.app/isAnchor'] !== 'true') return false;

      // Check axes: must be sampleId + clonotypeKey
      const axes = spec.axesSpec;
      if (!axes || axes.length !== 2) return false;

      const firstAxis = axes[0].name;
      const secondAxis = axes[1].name;

      return (
        firstAxis === 'pl7.app/sampleId'
        && (secondAxis === 'pl7.app/vdj/clonotypeKey' || secondAxis === 'pl7.app/vdj/scClonotypeKey')
      );
    }).map((opt) => ({ value: opt.ref, label: opt.label }));
  })

  .output('chainOptions', (ctx) => {
    const run = ctx.args.mixcrRun;
    if (run === undefined) return undefined;

    // Get the run ID from the selected clns file
    const runSpec = ctx.resultPool.getSpecByRef(run);
    if (!runSpec) return undefined;

    // Extract clonotypingRunId
    const runId = runSpec.domain?.['pl7.app/vdj/clonotypingRunId'];
    if (!runId) return undefined;

    // Find all potential chain/isotype tables associated with this run
    return ctx.resultPool.getOptions([{
      axes: [
        { name: 'pl7.app/sampleId' },
        { name: 'pl7.app/vdj/clonotypeKey' },
      ],
      annotations: { 'pl7.app/isAnchor': 'true' },
    }, {
      axes: [
        { name: 'pl7.app/sampleId' },
        { name: 'pl7.app/vdj/scClonotypeKey' },
      ],
      annotations: { 'pl7.app/isAnchor': 'true' },
    }],
    {
      label: { includeNativeLabel: false },
    })
      .filter((opt) => {
        const spec = ctx.resultPool.getSpecByRef(opt.ref);
        if (!spec || !isPColumnSpec(spec)) return false;

        // Check for run ID compatibility in the axis domain
        if (spec.axesSpec[1]?.domain?.['pl7.app/vdj/clonotypingRunId'] !== runId) return false;

        return true;
      })
      .map((opt) => ({ value: opt.ref, label: opt.label }));
  })

  .output('clonotypeDefinitionOptions', (ctx) => {
    // Use the first selected chain as reference for options
    const anchor = ctx.args.selectedChains[0];
    if (anchor === undefined) return undefined;

    const isSingleCell = ctx.resultPool.getPColumnSpecByRef(anchor)?.axesSpec[1].name === 'pl7.app/vdj/scClonotypeKey';

    const sequenceDomain: Record<string, string> = {};
    if (isSingleCell) {
      sequenceDomain['pl7.app/vdj/scClonotypeChain/index'] = 'primary';
    }

    return ctx.resultPool.getCanonicalOptions({ main: anchor },
      [
        {
          axes: [{ anchor: 'main', idx: 1 }],
          name: 'pl7.app/vdj/sequence',
          domain: sequenceDomain,
        },
        {
          axes: [{ anchor: 'main', idx: 1 }],
          name: 'pl7.app/vdj/geneHit',
        },
      ],
    );
  })

  .output('numberingAvailable', (ctx) => {
    const anchor = ctx.args.selectedChains[0];
    if (anchor === undefined) return false;

    const anchorSpec = ctx.resultPool.getPColumnSpecByRef(anchor);
    if (!anchorSpec) return false;

    const isSingleCell = anchorSpec.axesSpec[1].name === 'pl7.app/vdj/scClonotypeKey';

    const vdjRegionAa = ctx.resultPool.getAnchoredPColumns(
      { main: anchor },
      [{
        axes: [{ anchor: 'main', idx: 1 }],
        name: 'pl7.app/vdj/sequence',
        domain: {
          'pl7.app/vdj/feature': 'VDJRegion',
          'pl7.app/alphabet': 'aminoacid',
        },
      }, {
        axes: [{ anchor: 'main', idx: 1 }],
        name: 'pl7.app/vdj/sequence',
        domain: {
          'pl7.app/vdj/feature': 'VDJRegionInFrame',
          'pl7.app/alphabet': 'aminoacid',
        },
      }],
      { ignoreMissingDomains: true },
    );

    const assemblingVdj = (vdjRegionAa ?? []).filter((col) =>
      col.spec.annotations?.['pl7.app/vdj/isAssemblingFeature'] === 'true');

    const hasHeavy = assemblingVdj.some((col) => {
      if (isSingleCell) {
        const receptor = col.spec.axesSpec?.[0]?.domain?.['pl7.app/vdj/receptor'];
        if (receptor !== 'IG') return false;
        const index = col.spec.domain?.['pl7.app/vdj/scClonotypeChain/index'];
        if (index !== 'primary') return false;
        return col.spec.domain?.['pl7.app/vdj/scClonotypeChain'] === 'A';
      }
      return col.spec.domain?.['pl7.app/vdj/chain'] === 'IGHeavy'
        || col.spec.axesSpec?.some((axis) => axis.domain?.['pl7.app/vdj/chain'] === 'IGHeavy');
    });
    const hasLight = assemblingVdj.some((col) => {
      if (isSingleCell) {
        const receptor = col.spec.axesSpec?.[0]?.domain?.['pl7.app/vdj/receptor'];
        if (receptor !== 'IG') return false;
        const index = col.spec.domain?.['pl7.app/vdj/scClonotypeChain/index'];
        if (index !== 'primary') return false;
        return col.spec.domain?.['pl7.app/vdj/scClonotypeChain'] === 'B';
      }
      return col.spec.domain?.['pl7.app/vdj/chain'] === 'IGLight'
        || col.spec.axesSpec?.some((axis) => axis.domain?.['pl7.app/vdj/chain'] === 'IGLight');
    });

    const vdjOk = isSingleCell ? (hasHeavy && hasLight) : (hasHeavy || hasLight);
    if (vdjOk) return true;

    const cdr3MainAa = ctx.resultPool.getAnchoredPColumns(
      { main: anchor },
      [{
        axes: [{ anchor: 'main', idx: 1 }],
        name: 'pl7.app/vdj/sequence',
        domain: {
          'pl7.app/vdj/feature': 'CDR3',
          'pl7.app/alphabet': 'aminoacid',
        },
      }, {
        axes: [{ anchor: 'main', idx: 1 }],
        name: 'pl7.app/vdj/sequence',
        domain: {
          'pl7.app/vdj/feature': 'CDR3',
        },
      }],
      { ignoreMissingDomains: true },
    );

    if (!cdr3MainAa || cdr3MainAa.length === 0) return false;

    const cdr3MainFiltered = cdr3MainAa.filter((col) =>
      col.spec.annotations?.['pl7.app/vdj/isMainSequence'] === 'true');
    const cdr3Candidates = cdr3MainFiltered.length > 0 ? cdr3MainFiltered : cdr3MainAa;

    const hasCdr3Heavy = cdr3Candidates.some((col) => {
      if (isSingleCell) {
        const receptor = col.spec.axesSpec?.[0]?.domain?.['pl7.app/vdj/receptor'];
        if (receptor && receptor !== 'IG') return false;
        const index = col.spec.domain?.['pl7.app/vdj/scClonotypeChain/index'];
        if (index && index !== 'primary') return false;
        return col.spec.domain?.['pl7.app/vdj/scClonotypeChain'] === 'A';
      }
      return col.spec.domain?.['pl7.app/vdj/chain'] === 'IGHeavy'
        || col.spec.axesSpec?.some((axis) => axis.domain?.['pl7.app/vdj/chain'] === 'IGHeavy');
    });
    const hasCdr3Light = cdr3Candidates.some((col) => {
      if (isSingleCell) {
        const receptor = col.spec.axesSpec?.[0]?.domain?.['pl7.app/vdj/receptor'];
        if (receptor && receptor !== 'IG') return false;
        const index = col.spec.domain?.['pl7.app/vdj/scClonotypeChain/index'];
        if (index && index !== 'primary') return false;
        return col.spec.domain?.['pl7.app/vdj/scClonotypeChain'] === 'B';
      }
      return col.spec.domain?.['pl7.app/vdj/chain'] === 'IGLight'
        || col.spec.axesSpec?.some((axis) => axis.domain?.['pl7.app/vdj/chain'] === 'IGLight');
    });

    if (isSingleCell) {
      if (hasCdr3Heavy && hasCdr3Light) return true;
      return cdr3Candidates.length > 0;
    }
    return hasCdr3Heavy || hasCdr3Light || cdr3Candidates.length > 0;
  }, { retentive: true })

  .output('stats', (ctx) => {
    const tsv = ctx.outputs?.resolve('statsTsvContent')?.getDataAsString();
    if (!tsv) {
      return undefined;
    }
    const lines = tsv.trim().split('\n');
    if (lines.length !== 2) {
      return undefined;
    }
    const headers = lines[0].split('\t');
    const values = lines[1].split('\t');
    const beforeIndex = headers.indexOf('nClonotypesBefore');
    const afterIndex = headers.indexOf('nClonotypesAfter');

    if (beforeIndex === -1 || afterIndex === -1) {
      return undefined;
    }

    return {
      nClonotypesBefore: parseInt(values[beforeIndex], 10),
      nClonotypesAfter: parseInt(values[afterIndex], 10),
    };
  })
  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title(() => 'Redefine Clonotypes')

  .subtitle((ctx) => ctx.args.customBlockLabel || ctx.args.defaultBlockLabel)

  .sections((_ctx) => [{ type: 'link', href: '/', label: strings.titles.main }])

  .done(2);

export type BlockOutputs = InferOutputsType<typeof model>;

export { getDefaultBlockLabel } from './label';
