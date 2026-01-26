import type { InferOutputsType, PlRef, SUniversalPColumnId } from '@platforma-sdk/model';
import { BlockModel } from '@platforma-sdk/model';

export type BlockArgs = {
  defaultBlockLabel: string;
  customBlockLabel: string;
  anchorRef?: PlRef;
  clonotypeDefinition: SUniversalPColumnId[];
  numberingScheme?: 'imgt' | 'kabat' | 'chothia';
};

export const model = BlockModel.create()

  .withArgs<BlockArgs>({
    defaultBlockLabel: 'Select Clonotype Definition',
    customBlockLabel: '',
    clonotypeDefinition: [],
  })

  .argsValid((ctx) => ctx.args.anchorRef !== undefined && (ctx.args.clonotypeDefinition?.length ?? 0) > 0)

  .output('datasetOptions', (ctx) =>
    ctx.resultPool.getOptions([{
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
    }),
  )

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

    if (!vdjRegionAa || vdjRegionAa.length === 0) return false;

    const assemblingVdj = vdjRegionAa.filter((col) => col.spec.annotations?.['pl7.app/vdj/isAssemblingFeature'] === 'true');
    if (assemblingVdj.length === 0) return false;

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

    return isSingleCell ? (hasHeavy && hasLight) : (hasHeavy || hasLight);
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

  .sections((_ctx) => [{ type: 'link', href: '/', label: 'Main' }])

  .done(2);

export type BlockOutputs = InferOutputsType<typeof model>;
