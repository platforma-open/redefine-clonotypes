/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { blockSpec as clonotypingBlockSpec } from "@platforma-open/milaboratories.mixcr-clonotyping-2";
import type { BlockArgs as MiXCRClonotypingBlockArgs } from "@platforma-open/milaboratories.mixcr-clonotyping-2.model";
import { uniquePlId } from "@platforma-open/milaboratories.mixcr-clonotyping-2.model";
import type { BlockData } from "@platforma-open/milaboratories.redefine-clonotypes.model";
import { blockSpec as samplesAndDataBlockSpec } from "@platforma-open/milaboratories.samples-and-data";
import type { BlockArgs as SamplesAndDataBlockArgs } from "@platforma-open/milaboratories.samples-and-data.model";
import { wrapOutputs } from "@platforma-sdk/model";
import { awaitStableState, blockTest } from "@platforma-sdk/test";
import { RedefineClonotypesBlockPointer as redefineBlockSpec } from "this-block";

/**
 * Sets up a project with Samples & Data + MiXCR Clonotyping using bulk VDJ data.
 */
async function setupUpstreamPipeline(project: any, helpers: any, expect: any) {
  const sndBlockId = await project.addBlock("Samples & Data", samplesAndDataBlockSpec);
  const clonotypingBlockId = await project.addBlock("MiXCR Clonotyping", clonotypingBlockSpec);

  const sample1Id = uniquePlId();
  const sample2Id = uniquePlId();
  const sample3Id = uniquePlId();
  const metaColumn1Id = uniquePlId();
  const dataset1Id = uniquePlId();

  const r1Handle = await helpers.getLocalFileHandle("./assets/SRR11233652_sampledBulk_R1.fastq.gz");
  const r2Handle = await helpers.getLocalFileHandle("./assets/SRR11233652_sampledBulk_R2.fastq.gz");
  const s663R1 = await helpers.getLocalFileHandle("./assets/SRR11233663_sampledBulk_R1.fastq.gz");
  const s663R2 = await helpers.getLocalFileHandle("./assets/SRR11233663_sampledBulk_R2.fastq.gz");
  const s664R1 = await helpers.getLocalFileHandle("./assets/SRR11233664_sampledBulk_R1.fastq.gz");
  const s664R2 = await helpers.getLocalFileHandle("./assets/SRR11233664_sampledBulk_R2.fastq.gz");

  await project.setBlockArgs(sndBlockId, {
    metadata: [
      {
        id: metaColumn1Id,
        label: "MetaColumn1",
        global: false,
        valueType: "Long",
        data: { [sample1Id]: 2345, [sample2Id]: 3456, [sample3Id]: 4567 },
      },
    ],
    sampleIds: [sample1Id, sample2Id, sample3Id],
    sampleLabelColumnLabel: "Sample Name",
    sampleLabels: {
      [sample1Id]: "SRR11233652",
      [sample2Id]: "SRR11233663",
      [sample3Id]: "SRR11233664",
    },
    datasets: [
      {
        id: dataset1Id,
        label: "Dataset 1",
        content: {
          type: "Fastq",
          readIndices: ["R1", "R2"],
          gzipped: true,
          data: {
            [sample1Id]: { R1: r1Handle, R2: r2Handle },
            [sample2Id]: { R1: s663R1, R2: s663R2 },
            [sample3Id]: { R1: s664R1, R2: s664R2 },
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
      value: {
        [r1Handle]: { done: true },
        [r2Handle]: { done: true },
        [s663R1]: { done: true },
        [s663R2]: { done: true },
        [s664R1]: { done: true },
        [s664R2]: { done: true },
      },
    },
  });

  // Wait for clonotyping to detect inputs
  const clonotypingState1 = (await awaitStableState(
    project.getBlockState(clonotypingBlockId),
    60000,
  )) as any;

  const clonotypingOutputs1 = wrapOutputs(clonotypingState1.outputs) as any;
  expect(clonotypingOutputs1.inputOptions.length).toBeGreaterThan(0);

  // Configure and run clonotyping with IGHeavy chain
  await project.setBlockArgs(clonotypingBlockId, {
    input: clonotypingOutputs1.inputOptions[0].ref,
    preset: { type: "name", name: "neb-human-rna-xcr-umi-nebnext" },
    chains: ["IGHeavy"],
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
  "basic clonotype redefinition",
  { timeout: 600000 },
  async ({ rawPrj: project, helpers, expect }) => {
    await setupUpstreamPipeline(project, helpers, expect);

    const redefineBlockId = await project.addBlock("Redefine Clonotypes", redefineBlockSpec);

    // Step 1: Wait for run options
    const redefineState1 = await awaitStableState(project.getBlockState(redefineBlockId), 60000);
    const redefineOutputs1 = redefineState1.outputs as Record<string, any>;
    expect(redefineOutputs1.inputOptions?.ok).toBe(true);
    const runOpts = redefineOutputs1.inputOptions?.value ?? [];
    expect(runOpts.length, "Should have run options").toBeGreaterThan(0);
    const inputRef = runOpts[0].ref;

    // Step 2: Select run, wait for chain options
    await project.mutateBlockStorage(redefineBlockId, {
      operation: "update-block-data",
      value: {
        defaultBlockLabel: "",
        customBlockLabel: "",
        inputRef,
        selectedChainRefs: [],
        clonotypeDefinition: [],
      } satisfies BlockData,
    });

    const redefineState2 = await awaitStableState(project.getBlockState(redefineBlockId), 60000);
    const redefineOutputs2 = redefineState2.outputs as Record<string, any>;
    expect(redefineOutputs2.chainOptions?.ok).toBe(true);
    const chainOpts = redefineOutputs2.chainOptions?.value ?? [];
    expect(chainOpts.length, "Should have chain options").toBeGreaterThan(0);
    const selectedChainRefs = chainOpts.map((o: any) => o.value);

    // Step 3: Select chains, wait for definition options
    await project.mutateBlockStorage(redefineBlockId, {
      operation: "update-block-data",
      value: {
        defaultBlockLabel: "",
        customBlockLabel: "",
        inputRef,
        selectedChainRefs,
        clonotypeDefinition: [],
      } satisfies BlockData,
    });

    const redefineState3 = await awaitStableState(project.getBlockState(redefineBlockId), 60000);
    const redefineOutputs3 = redefineState3.outputs as Record<string, any>;
    expect(redefineOutputs3.clonotypeDefinitionOptions?.ok).toBe(true);
    const defOpts = redefineOutputs3.clonotypeDefinitionOptions?.value ?? [];
    expect(defOpts.length, "Should have clonotype definition options").toBeGreaterThan(0);

    // Step 4: Select definition and run
    const cdr3AaOpt = defOpts.find((o: any) => o.label?.includes("CDR3 aa"));
    const selectedDef = cdr3AaOpt ?? defOpts[0];

    await project.mutateBlockStorage(redefineBlockId, {
      operation: "update-block-data",
      value: {
        defaultBlockLabel: "",
        customBlockLabel: "",
        inputRef,
        selectedChainRefs,
        clonotypeDefinition: [selectedDef.value],
      } satisfies BlockData,
    });

    await project.runBlock(redefineBlockId);
    const redefineState4 = await helpers.awaitBlockDoneAndGetStableBlockState(
      redefineBlockId,
      300000,
    );

    // Verify per-chain stats output
    const finalOutputs = redefineState4.outputs as Record<string, any>;
    expect(finalOutputs.perChainStats?.ok).toBe(true);
    const perChainStats = finalOutputs.perChainStats?.value;
    expect(perChainStats).toBeDefined();
    expect(perChainStats.length).toBeGreaterThan(0);
    expect(perChainStats[0].nClonotypesBefore, "Should have input clonotypes").toBeGreaterThan(0);
    expect(perChainStats[0].nClonotypesAfter, "Should have output clonotypes").toBeGreaterThan(0);
  },
);

blockTest(
  "redefinition with custom memory settings",
  { timeout: 600000 },
  async ({ rawPrj: project, helpers, expect }) => {
    await setupUpstreamPipeline(project, helpers, expect);

    const redefineBlockId = await project.addBlock("Redefine Clonotypes", redefineBlockSpec);

    // Step 1: Wait for run options
    const redefineState1 = await awaitStableState(project.getBlockState(redefineBlockId), 60000);
    const redefineOutputs1 = redefineState1.outputs as Record<string, any>;
    const runOpts = redefineOutputs1.inputOptions?.value ?? [];
    expect(runOpts.length).toBeGreaterThan(0);
    const inputRef = runOpts[0].ref;

    // Step 2: Select run, wait for chain options
    await project.mutateBlockStorage(redefineBlockId, {
      operation: "update-block-data",
      value: {
        defaultBlockLabel: "",
        customBlockLabel: "",
        inputRef,
        selectedChainRefs: [],
        clonotypeDefinition: [],
        mem: 32,
        cpu: 2,
      } satisfies BlockData,
    });

    const redefineState2 = await awaitStableState(project.getBlockState(redefineBlockId), 60000);
    const chainOpts = (redefineState2.outputs as Record<string, any>).chainOptions?.value ?? [];
    expect(chainOpts.length).toBeGreaterThan(0);
    const selectedChainRefs = chainOpts.map((o: any) => o.value);

    // Step 3: Select chains, wait for definition options
    await project.mutateBlockStorage(redefineBlockId, {
      operation: "update-block-data",
      value: {
        defaultBlockLabel: "",
        customBlockLabel: "",
        inputRef,
        selectedChainRefs,
        clonotypeDefinition: [],
        mem: 32,
        cpu: 2,
      } satisfies BlockData,
    });

    const redefineState3 = await awaitStableState(project.getBlockState(redefineBlockId), 60000);
    const defOpts =
      (redefineState3.outputs as Record<string, any>).clonotypeDefinitionOptions?.value ?? [];

    // Step 4: Select definition and run
    const cdr3AaOpt = defOpts.find((o: any) => o.label?.includes("CDR3 aa"));
    const selectedDef = cdr3AaOpt ?? defOpts[0];

    await project.mutateBlockStorage(redefineBlockId, {
      operation: "update-block-data",
      value: {
        defaultBlockLabel: "",
        customBlockLabel: "",
        inputRef,
        selectedChainRefs,
        clonotypeDefinition: [selectedDef.value],
        mem: 32,
        cpu: 2,
      } satisfies BlockData,
    });

    await project.runBlock(redefineBlockId);
    const redefineState4 = await helpers.awaitBlockDoneAndGetStableBlockState(
      redefineBlockId,
      300000,
    );

    const finalOutputs = redefineState4.outputs as Record<string, any>;
    expect(finalOutputs.perChainStats?.ok).toBe(true);
    const stats = finalOutputs.perChainStats?.value?.[0];
    expect(stats.nClonotypesBefore).toBeGreaterThan(0);
    expect(stats.nClonotypesAfter).toBeGreaterThan(0);
  },
);

// Exercises the cut
blockTest(
  "top-N selection keeps exactly N redefined clonotypes",
  { timeout: 900000 },
  async ({ rawPrj: project, helpers, expect }) => {
    await setupUpstreamPipeline(project, helpers, expect);

    const redefineBlockId = await project.addBlock("Redefine Clonotypes", redefineBlockSpec);

    // Step 1: Wait for run options
    const redefineState1 = await awaitStableState(project.getBlockState(redefineBlockId), 60000);
    const runOpts = (redefineState1.outputs as Record<string, any>).inputOptions?.value ?? [];
    expect(runOpts.length).toBeGreaterThan(0);
    const inputRef = runOpts[0].ref;

    // Step 2: Select run, wait for chain options
    await project.mutateBlockStorage(redefineBlockId, {
      operation: "update-block-data",
      value: {
        defaultBlockLabel: "",
        customBlockLabel: "",
        inputRef,
        selectedChainRefs: [],
        clonotypeDefinition: [],
      } satisfies BlockData,
    });

    const redefineState2 = await awaitStableState(project.getBlockState(redefineBlockId), 60000);
    const chainOpts = (redefineState2.outputs as Record<string, any>).chainOptions?.value ?? [];
    expect(chainOpts.length).toBeGreaterThan(0);
    const selectedChainRefs = chainOpts.map((o: any) => o.value);

    // Step 3: Select chains, wait for definition options
    await project.mutateBlockStorage(redefineBlockId, {
      operation: "update-block-data",
      value: {
        defaultBlockLabel: "",
        customBlockLabel: "",
        inputRef,
        selectedChainRefs,
        clonotypeDefinition: [],
      } satisfies BlockData,
    });

    const redefineState3 = await awaitStableState(project.getBlockState(redefineBlockId), 60000);
    const defOpts =
      (redefineState3.outputs as Record<string, any>).clonotypeDefinitionOptions?.value ?? [];
    expect(defOpts.length).toBeGreaterThan(0);

    // Step 4: Redefine with no cut, to establish the baseline the cut is measured against.
    const cdr3AaOpt = defOpts.find((o: any) => o.label?.includes("CDR3 aa"));
    const selectedDef = cdr3AaOpt ?? defOpts[0];
    const baseData = {
      defaultBlockLabel: "",
      customBlockLabel: "",
      inputRef,
      selectedChainRefs,
      clonotypeDefinition: [selectedDef.value],
    } satisfies BlockData;

    await project.mutateBlockStorage(redefineBlockId, {
      operation: "update-block-data",
      value: baseData,
    });
    await project.runBlock(redefineBlockId);
    const uncutState = await helpers.awaitBlockDoneAndGetStableBlockState(redefineBlockId, 300000);
    const uncutOutputs = uncutState.outputs as Record<string, any>;
    expect(uncutOutputs.perChainStats?.ok).toBe(true);
    const uncutStats = uncutOutputs.perChainStats?.value?.[0];

    // The definition has to actually merge, or the cut below proves nothing.
    expect(uncutStats.nClonotypesBefore).toBeGreaterThan(uncutStats.nClonotypesAfter);
    // Enough redefined clonotypes left that a top-2 request drops at least one.
    expect(uncutStats.nClonotypesAfter).toBeGreaterThan(2);
    // No cut requested, so every redefined clonotype is retained.
    expect(uncutStats.nClonotypesRetained).toEqual(uncutStats.nClonotypesAfter);

    // Step 5: Same definition, now keeping only the top 2 by total primary abundance.
    const topClonotypes = 2;
    await project.mutateBlockStorage(redefineBlockId, {
      operation: "update-block-data",
      value: { ...baseData, topClonotypes } satisfies BlockData,
    });
    await project.runBlock(redefineBlockId);
    const cutState = await helpers.awaitBlockDoneAndGetStableBlockState(redefineBlockId, 300000);
    const cutOutputs = cutState.outputs as Record<string, any>;
    expect(cutOutputs.perChainStats?.ok).toBe(true);
    const cutStats = cutOutputs.perChainStats?.value?.[0];

    // The cut runs on the merged keys, so exactly N survive...
    expect(cutStats.nClonotypesRetained).toEqual(topClonotypes);
    // ...and it is the cut doing the work, not a different redefinition.
    expect(cutStats.nClonotypesAfter).toEqual(uncutStats.nClonotypesAfter);
    expect(cutStats.nClonotypesBefore).toEqual(uncutStats.nClonotypesBefore);
  },
);
