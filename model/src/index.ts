import strings from '@milaboratories/strings';
import type { InferOutputsType, PlRef, SUniversalPColumnId } from '@platforma-sdk/model';
import { BlockModel } from '@platforma-sdk/model';
import { getDefaultBlockLabel } from './label';

/** Parses the numbering_stats.tsv produced by the anarci-numbering software.
 *  Returns how many clonotypes existed vs how many ANARCI could number. */
function parseNumberingStats(tsv: string | undefined): { total: number; numbered: number } | undefined {
  if (!tsv) return undefined;

  // TSV has exactly 2 lines: header + one data row
  const lines = tsv.trim().split('\n');
  if (lines.length !== 2) return undefined;
  const headers = lines[0].split('\t');
  const values = lines[1].split('\t');

  const totalIdx = headers.indexOf('totalClonotypes');
  if (totalIdx === -1) return undefined;
  const total = parseInt(values[totalIdx], 10);

  // ANARCI reports H and KL chains separately; take the relevant one
  const hIdx = headers.indexOf('numberedH');
  const klIdx = headers.indexOf('numberedKL');
  const numberedH = hIdx !== -1 ? parseInt(values[hIdx], 10) : 0;
  const numberedKL = klIdx !== -1 ? parseInt(values[klIdx], 10) : 0;

  return { total, numbered: Math.max(numberedH, numberedKL) };
}

export type BlockArgs = {
  defaultBlockLabel: string;
  customBlockLabel: string;
  anchorRef?: PlRef;
  clonotypeDefinition: SUniversalPColumnId[];
  numberingScheme?: 'imgt' | 'kabat' | 'chothia';
};

export const model = BlockModel.create()

  .withArgs<BlockArgs>({
    defaultBlockLabel: getDefaultBlockLabel({ clonotypeDefinitionLabels: [] }),
    customBlockLabel: '',
    clonotypeDefinition: [],
  })

  .argsValid((ctx) => ctx.args.anchorRef !== undefined && (ctx.args.clonotypeDefinition?.length ?? 0) > 0)

  .output('datasetOptions', (ctx) => {
    const options = ctx.resultPool.getOptions([{
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
    });

    return options.filter((option) => {
      const spec = ctx.resultPool.getPColumnSpecByRef(option.ref);
      return spec?.axesSpec[1]?.domain?.['pl7.app/redefined-by'] === undefined;
    });
  })

  .output('clonotypeDefinitionOptions', (ctx) => {
    const anchor = ctx.args.anchorRef;
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
    const anchor = ctx.args.anchorRef;
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

  .output('numberingStats', (ctx) => {
    if (!ctx.args.numberingScheme) return undefined;
    const tsv = ctx.outputs?.resolve({ field: 'numberingStatsContent', assertFieldType: 'Input', allowPermanentAbsence: true })?.getDataAsString();
    return parseNumberingStats(tsv);
  })

  .output('numberingWarning', (ctx) => {
    if (!ctx.args.numberingScheme) return undefined;
    const tsv = ctx.outputs?.resolve({ field: 'numberingStatsContent', assertFieldType: 'Input', allowPermanentAbsence: true })?.getDataAsString();
    const ns = parseNumberingStats(tsv);
    if (!ns) return undefined;
    if (ns.numbered === 0) {
      return `ANARCI could not number any of the ${ns.total.toLocaleString()} clonotypes. The framework regions may be too divergent from known germline sequences.`;
    }
    if (ns.numbered < ns.total * 0.5) {
      return `ANARCI could only number ${ns.numbered.toLocaleString()} of ${ns.total.toLocaleString()} clonotypes. The framework regions may be divergent from known germline sequences. Unnumbered clonotypes are excluded from the output.`;
    }
    return undefined;
  })
  .output('isRunning', (ctx) => ctx.outputs?.getIsReadyOrError() === false)

  .title(() => 'Redefine Clonotypes')

  .subtitle((ctx) => ctx.args.customBlockLabel || ctx.args.defaultBlockLabel)

  .sections((_ctx) => [{ type: 'link', href: '/', label: strings.titles.main }])

  .done(2);

export type BlockOutputs = InferOutputsType<typeof model>;

export { getDefaultBlockLabel } from './label';
