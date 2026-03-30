import strings from '@milaboratories/strings';
import type { InferOutputsType, PlRef, SUniversalPColumnId } from '@platforma-sdk/model';
import { BlockModel } from '@platforma-sdk/model';
import { getDefaultBlockLabel } from './label';

/** Parses the numbering_stats.tsv produced by the anarci-numbering software.
 *  Returns how many clonotypes existed vs how many ANARCI could number,
 *  plus sample AA sequences from unnumbered clonotypes for debugging. */
function parseNumberingStats(tsv: string | undefined): {
  total: number;
  numbered: number;
  unnumberedSamples: string[];
} | undefined {
  if (!tsv) return undefined;

  // TSV has exactly 2 lines: header + one data row
  const lines = tsv.trim().split('\n');
  if (lines.length !== 2) return undefined;
  const headers = lines[0].split('\t');
  const values = lines[1].split('\t');

  const totalIdx = headers.indexOf('totalClonotypes');
  if (totalIdx === -1) return undefined;
  const total = parseInt(values[totalIdx], 10);
  if (Number.isNaN(total)) return undefined;

  // ANARCI reports H and KL chains separately; take the relevant one
  const hIdx = headers.indexOf('numberedH');
  const klIdx = headers.indexOf('numberedKL');
  const numberedH = hIdx !== -1 ? (parseInt(values[hIdx], 10) || 0) : 0;
  const numberedKL = klIdx !== -1 ? (parseInt(values[klIdx], 10) || 0) : 0;

  // Sample AA sequences from clonotypes ANARCI could not number (format: "key|chain|sequence")
  const samplesIdx = headers.indexOf('unnumberedSamples');
  const samplesRaw = samplesIdx !== -1 ? (values[samplesIdx] ?? '') : '';
  const unnumberedSamples = samplesRaw ? samplesRaw.split(';').filter(Boolean) : [];

  return { total, numbered: Math.max(numberedH, numberedKL), unnumberedSamples };
}

export type BlockArgs = {
  defaultBlockLabel: string;
  customBlockLabel: string;
  mixcrRunRef?: PlRef;
  selectedChainRefs: PlRef[];
  clonotypeDefinition: SUniversalPColumnId[];
  numberingScheme?: 'imgt' | 'kabat' | 'chothia';
};

export const model = BlockModel.create()

  .withArgs<BlockArgs>({
    defaultBlockLabel: getDefaultBlockLabel({ clonotypeDefinitionLabels: [] }),
    customBlockLabel: '',
    selectedChainRefs: [],
    clonotypeDefinition: [],
  })

  .argsValid((ctx) => ctx.args.mixcrRunRef !== undefined && ctx.args.selectedChainRefs.length > 0 && (ctx.args.clonotypeDefinition?.length ?? 0) > 0)

  .output('mixcrRunOptions', (ctx) =>
    ctx.resultPool.getOptions([
      {
        name: 'mixcr.com/clns', // The main clns file represents the run
      },
    ], {
      label: { includeNativeLabel: false, forceTraceElements: ['milaboratories.samples-and-data/dataset'] }, // We'll rely on block label from trace if possible, or standard label
    }),
  )

  .output('chainOptions', (ctx) => {
    const run = ctx.args.mixcrRunRef;
    if (run === undefined) return undefined;

    // Get the run ID from the selected clns file
    const runSpec = ctx.resultPool.getSpecByRef(run);
    if (!runSpec) return undefined;

    // Extract clonotypingRunId
    const runId = runSpec.domain?.['pl7.app/vdj/clonotypingRunId'];
    if (!runId) return undefined;

    // Find all chain/isotype tables associated with this run
    return ctx.resultPool.getOptions([{
      axes: [
        { name: 'pl7.app/sampleId' },
        { name: 'pl7.app/vdj/clonotypeKey',
          domain: { 'pl7.app/vdj/clonotypingRunId': runId },
        },
      ],
      annotations: { 'pl7.app/isAnchor': 'true' },
    }, {
      axes: [
        { name: 'pl7.app/sampleId' },
        { name: 'pl7.app/vdj/scClonotypeKey',
          domain: { 'pl7.app/vdj/clonotypingRunId': runId },
        },
      ],
      annotations: { 'pl7.app/isAnchor': 'true' },
    }],
    {
      label: { includeNativeLabel: false },
    })
      .map((opt) => ({ value: opt.ref, label: opt.label }));
  })

  .output('clonotypeDefinitionOptions', (ctx) => {
    // Use the first selected chain as reference for options
    const anchor = ctx.args.selectedChainRefs[0];
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
    const anchor = ctx.args.selectedChainRefs[0];
    if (anchor === undefined) return false;

    const anchorSpec = ctx.resultPool.getPColumnSpecByRef(anchor);
    if (!anchorSpec) return false;

    // Detect single-cell input
    const isSingleCell = anchorSpec.axesSpec[1].name === 'pl7.app/vdj/scClonotypeKey';

    const isChain = (col: { spec: { domain?: Record<string, string>; axesSpec?: { domain?: Record<string, string> }[] } },
      scChain: string,
      bulkChain: string) => {
      if (isSingleCell) {
        return col.spec.axesSpec?.[0]?.domain?.['pl7.app/vdj/receptor'] === 'IG'
          && col.spec.domain?.['pl7.app/vdj/scClonotypeChain/index'] === 'primary'
          && col.spec.domain?.['pl7.app/vdj/scClonotypeChain'] === scChain;
      }
      // @TODO: Remove spec.domain check if no block generates it (also from workflow)
      return col.spec.domain?.['pl7.app/vdj/chain'] === bulkChain
        || col.spec.axesSpec?.some((axis) => axis.domain?.['pl7.app/vdj/chain'] === bulkChain);
    };

    const hasRequiredChains = (columns: { spec: { domain?: Record<string, string>; axesSpec?: { domain?: Record<string, string> }[] } }[]) => {
      const hasHeavy = columns.some((col) => isChain(col, 'A', 'IGHeavy'));
      const hasLight = columns.some((col) => isChain(col, 'B', 'IGLight'));
      return isSingleCell ? (hasHeavy && hasLight) : (hasHeavy || hasLight);
    };

    // Detect scFv mode: individual chain sequences are not marked as
    // assembling features / main sequences, so filters must be relaxed.
    const scFvCols = ctx.resultPool.getAnchoredPColumns(
      { main: anchor },
      [{ axes: [{ anchor: 'main', idx: 1 }], name: 'pl7.app/vdj/scFv-sequence' }],
      { ignoreMissingDomains: true },
    );
    const isScFv = (scFvCols ?? []).length > 0;

    // VDJRegion path: AA sequences
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

    // Select valid VDJRegion/VDJRegionInFrame AA columns for numbering
    const vdjCandidates = isScFv
      ? (vdjRegionAa ?? [])
      : (vdjRegionAa ?? []).filter((col) =>
          col.spec.annotations?.['pl7.app/vdj/isAssemblingFeature'] === 'true');
    // If the selected columns cover the required chains allow numbering with ANARCI
    if (hasRequiredChains(vdjCandidates)) return true;

    // CDR3 fallback: AA sequences
    const cdr3Aa = ctx.resultPool.getAnchoredPColumns(
      { main: anchor },
      [{
        axes: [{ anchor: 'main', idx: 1 }],
        name: 'pl7.app/vdj/sequence',
        domain: {
          'pl7.app/vdj/feature': 'CDR3',
          'pl7.app/alphabet': 'aminoacid',
        },
      }],
      { ignoreMissingDomains: true },
    );

    // Select valid CDR3 AA columns for numbering
    const cdr3Candidates = isScFv
      ? (cdr3Aa ?? [])
      : (cdr3Aa ?? []).filter((col) =>
          col.spec.annotations?.['pl7.app/vdj/isMainSequence'] === 'true');
    // If the selected columns cover the required chains allow numbering with in-house script
    return hasRequiredChains(cdr3Candidates);
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

  .output('numberingStats', (ctx) => {
    if (!ctx.args.numberingScheme) return undefined;
    const tsv = ctx.outputs?.resolve({ field: 'numberingStatsContent', assertFieldType: 'Input', allowPermanentAbsence: true })?.getDataAsString();
    return parseNumberingStats(tsv);
  })

  .output('anarciLog', (ctx) => {
    return ctx.outputs?.resolve({ field: 'anarciLog', assertFieldType: 'Input', allowPermanentAbsence: true })?.getLogHandle();
  })

  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title(() => 'Redefine Clonotypes')

  .subtitle((ctx) => ctx.args.customBlockLabel || ctx.args.defaultBlockLabel)

  .sections((_ctx) => [{ type: 'link', href: '/', label: strings.titles.main }])

  .done(2);

export type BlockOutputs = InferOutputsType<typeof model>;

export { getDefaultBlockLabel } from './label';
