import type { InferOutputsType, PlRef, SUniversalPColumnId } from '@platforma-sdk/model';
import { BlockModel } from '@platforma-sdk/model';

export type BlockArgs = {
  anchorRef?: PlRef;
  clonotypeDefinition: SUniversalPColumnId[];
};

export type UiState = {
  title: string;
};

export const model = BlockModel.create()

  .withArgs<BlockArgs>({
    clonotypeDefinition: [],
  })

  .withUiState<UiState>({
    title: 'Redefine Clonotypes',
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

    return ctx.resultPool.getCanonicalOptions({ main: anchor },
      [
        {
          axes: [{ anchor: 'main', idx: 1 }],
          name: 'pl7.app/vdj/sequence',
        },
        {
          axes: [{ anchor: 'main', idx: 1 }],
          name: 'pl7.app/vdj/geneHit',
        },
      ],
    );
  })

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

  .title((ctx) => ctx.uiState.title)

  .sections((_ctx) => [{ type: 'link', href: '/', label: 'Main' }])

  .done();

export type BlockOutputs = InferOutputsType<typeof model>;
