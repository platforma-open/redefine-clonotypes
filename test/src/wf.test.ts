/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import type {
  BlockArgs,
} from '@platforma-open/milaboratories.redefine-clonotypes.model';
import { blockSpec as clonotypingBlockSpec } from '@platforma-open/milaboratories.mixcr-clonotyping-2';
import type {
  BlockArgs as MiXCRClonotypingBlockArgs,
} from '@platforma-open/milaboratories.mixcr-clonotyping-2.model';
import {
  uniquePlId,
} from '@platforma-open/milaboratories.mixcr-clonotyping-2.model';
import { blockSpec as samplesAndDataBlockSpec } from '@platforma-open/milaboratories.samples-and-data';
import type { BlockArgs as SamplesAndDataBlockArgs } from '@platforma-open/milaboratories.samples-and-data.model';
import { wrapOutputs } from '@platforma-sdk/model';
import { awaitStableState, blockTest } from '@platforma-sdk/test';
import { blockSpec as redefineBlockSpec } from 'this-block';

/**
 * Sets up a project with Samples & Data + MiXCR Clonotyping using bulk VDJ data.
 */
async function setupUpstreamPipeline(
  project: any,
  helpers: any,
  expect: any,
) {
  const sndBlockId = await project.addBlock('Samples & Data', samplesAndDataBlockSpec);
  const clonotypingBlockId = await project.addBlock('MiXCR Clonotyping', clonotypingBlockSpec);

  const sample1Id = uniquePlId();
  const metaColumn1Id = uniquePlId();
  const dataset1Id = uniquePlId();

  const r1Handle = await helpers.getLocalFileHandle(
    './assets/SRR11233652_sampledBulk_R1.fastq.gz',
  );
  const r2Handle = await helpers.getLocalFileHandle(
    './assets/SRR11233652_sampledBulk_R2.fastq.gz',
  );

  await project.setBlockArgs(sndBlockId, {
    metadata: [
      {
        id: metaColumn1Id,
        label: 'MetaColumn1',
        global: false,
        valueType: 'Long',
        data: { [sample1Id]: 2345 },
      },
    ],
    sampleIds: [sample1Id],
    sampleLabelColumnLabel: 'Sample Name',
    sampleLabels: { [sample1Id]: 'Sample 1' },
    datasets: [
      {
        id: dataset1Id,
        label: 'Dataset 1',
        content: {
          type: 'Fastq',
          readIndices: ['R1', 'R2'],
          gzipped: true,
          data: {
            [sample1Id]: { R1: r1Handle, R2: r2Handle },
          },
        },
      },
    ],
  } as unknown as SamplesAndDataBlockArgs);

  await project.runBlock(sndBlockId);
  const sndStableState = await helpers.awaitBlockDoneAndGetStableBlockState(sndBlockId, 100000);
  expect(sndStableState.outputs).toMatchObject({
    fileImports: {
      ok: true,
      value: { [r1Handle]: { done: true }, [r2Handle]: { done: true } },
    },
  });

  // Wait for clonotyping to detect inputs
  const clonotypingState1 = await awaitStableState(
    project.getBlockState(clonotypingBlockId),
    60000,
  ) as any;

  const clonotypingOutputs1 = wrapOutputs(clonotypingState1.outputs) as any;
  expect(clonotypingOutputs1.inputOptions.length).toBeGreaterThan(0);

  // Configure and run clonotyping with IGHeavy chain
  await project.setBlockArgs(clonotypingBlockId, {
    input: clonotypingOutputs1.inputOptions[0].ref,
    preset: { type: 'name', name: 'neb-human-rna-xcr-umi-nebnext' },
    chains: ['IGHeavy'],
  } as unknown as MiXCRClonotypingBlockArgs);

  await project.runBlock(clonotypingBlockId);
  const clonotypingState2 = await helpers.awaitBlockDoneAndGetStableBlockState(
    clonotypingBlockId,
    300000,
  );
  const clonotypingOutputs2 = wrapOutputs(clonotypingState2.outputs) as any;
  expect(clonotypingOutputs2.reports.isComplete).toEqual(true);

  return { sndBlockId, clonotypingBlockId };
}

blockTest(
  'basic clonotype redefinition',
  { timeout: 600000 },
  async ({ rawPrj: project, helpers, expect }) => {
    await setupUpstreamPipeline(project, helpers, expect);

    const redefineBlockId = await project.addBlock('Redefine Clonotypes', redefineBlockSpec);

    // Wait for dataset options
    const redefineState1 = await awaitStableState(
      project.getBlockState(redefineBlockId),
      60000,
    );
    const redefineOutputs1 = redefineState1.outputs as Record<string, any>;
    expect(redefineOutputs1.datasetOptions?.ok).toBe(true);
    const datasetOpts = redefineOutputs1.datasetOptions?.value ?? [];
    expect(datasetOpts.length, 'Should have dataset options').toBeGreaterThan(0);

    // Select dataset
    await project.setBlockArgs(redefineBlockId, {
      defaultBlockLabel: '',
      customBlockLabel: '',
      anchorRef: datasetOpts[0].ref,
      clonotypeDefinition: [],
    } satisfies BlockArgs);

    // Wait for definition options
    const redefineState2 = await awaitStableState(
      project.getBlockState(redefineBlockId),
      60000,
    );
    const redefineOutputs2 = redefineState2.outputs as Record<string, any>;
    expect(redefineOutputs2.clonotypeDefinitionOptions?.ok).toBe(true);
    const defOpts = redefineOutputs2.clonotypeDefinitionOptions?.value ?? [];
    expect(defOpts.length, 'Should have clonotype definition options').toBeGreaterThan(0);

    // Select CDR3 aa as new clonotype definition
    const cdr3AaOpt = defOpts.find((o: any) => o.label?.includes('CDR3 aa'));
    const selectedDef = cdr3AaOpt ?? defOpts[0];

    await project.setBlockArgs(redefineBlockId, {
      defaultBlockLabel: '',
      customBlockLabel: '',
      anchorRef: datasetOpts[0].ref,
      clonotypeDefinition: [selectedDef.value],
    } satisfies BlockArgs);

    // Run the block
    await project.runBlock(redefineBlockId);
    const redefineState3 = await helpers.awaitBlockDoneAndGetStableBlockState(
      redefineBlockId,
      300000,
    );

    // Verify stats output
    const finalOutputs = redefineState3.outputs as Record<string, any>;
    expect(finalOutputs.stats?.ok).toBe(true);
    const stats = finalOutputs.stats?.value;
    expect(stats).toBeDefined();
    expect(stats.nClonotypesBefore, 'Should have input clonotypes').toBeGreaterThan(0);
    expect(stats.nClonotypesAfter, 'Should have output clonotypes').toBeGreaterThan(0);

    // PFrame exports go to the result pool, not block outputs.
    // Stats verification above confirms the workflow completed correctly.
  },
);

blockTest(
  'redefinition with custom memory settings',
  { timeout: 600000 },
  async ({ rawPrj: project, helpers, expect }) => {
    await setupUpstreamPipeline(project, helpers, expect);

    const redefineBlockId = await project.addBlock('Redefine Clonotypes', redefineBlockSpec);

    const redefineState1 = await awaitStableState(
      project.getBlockState(redefineBlockId),
      60000,
    );
    const redefineOutputs1 = redefineState1.outputs as Record<string, any>;
    const datasetOpts = redefineOutputs1.datasetOptions?.value ?? [];
    expect(datasetOpts.length).toBeGreaterThan(0);

    await project.setBlockArgs(redefineBlockId, {
      defaultBlockLabel: '',
      customBlockLabel: '',
      anchorRef: datasetOpts[0].ref,
      clonotypeDefinition: [],
    } satisfies BlockArgs);

    const redefineState2 = await awaitStableState(
      project.getBlockState(redefineBlockId),
      60000,
    );
    const defOpts = (redefineState2.outputs as Record<string, any>).clonotypeDefinitionOptions?.value ?? [];

    // Configure with custom memory and CPU
    const cdr3AaOpt = defOpts.find((o: any) => o.label?.includes('CDR3 aa'));
    const selectedDef = cdr3AaOpt ?? defOpts[0];

    await project.setBlockArgs(redefineBlockId, {
      defaultBlockLabel: '',
      customBlockLabel: '',
      anchorRef: datasetOpts[0].ref,
      clonotypeDefinition: [selectedDef.value],
      mem: 32,
      cpu: 2,
    } satisfies BlockArgs);

    await project.runBlock(redefineBlockId);
    const redefineState3 = await helpers.awaitBlockDoneAndGetStableBlockState(
      redefineBlockId,
      300000,
    );

    const finalOutputs = redefineState3.outputs as Record<string, any>;
    expect(finalOutputs.stats?.ok).toBe(true);
    const stats = finalOutputs.stats?.value;
    expect(stats.nClonotypesBefore).toBeGreaterThan(0);
    expect(stats.nClonotypesAfter).toBeGreaterThan(0);
  },
);
