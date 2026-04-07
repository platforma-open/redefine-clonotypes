<script setup lang="ts">
import type { PlRef } from '@platforma-sdk/model';
import { PlAccordionSection, PlAlert, PlBlockPage, PlBtnGhost, PlDropdown, PlDropdownMulti, PlDropdownRef, PlLogView, PlMaskIcon24, PlNumberField, PlSectionSeparator, PlSlideModal, PlTabs } from '@platforma-sdk/ui-vue';
import { computed, ref, watch, watchEffect } from 'vue';
import { useApp } from '../app';

const app = useApp();
const anarciLogOpen = ref(false);

// Block is valid when a run, at least one chain, and at least one definition column are selected
const isValid = computed(() =>
  app.model.args.inputRef !== undefined
  && app.model.args.selectedChainRefs.length > 0
  && (app.model.args.clonotypeDefinition?.length ?? 0) > 0,
);

const numberingAvailable = computed(() => app.model.outputs.numberingAvailable === true);
const numberingDisabled = computed(() => app.model.args.selectedChainRefs.length === 0 || !numberingAvailable.value);

// Show chain selector only when the selected run has multiple chains (e.g., single-cell with IG + TCR)
const showChainSelector = computed(() => (app.model.outputs.chainOptions?.length ?? 0) > 1);

const numberingSchemeOptions = [
  { label: 'IMGT', value: 'imgt' },
  { label: 'Kabat', value: 'kabat' },
  { label: 'Chothia', value: 'chothia' },
];

// Reset numbering scheme when run is cleared or numbering becomes unavailable
watchEffect(() => {
  if (app.model.args.inputRef === undefined || app.model.outputs.numberingAvailable === false) {
    app.model.args.numberingScheme = undefined;
  }
});

// Stable fingerprint of chain options — reduces the option array to a primitive string
// so Vue's watch compares by value, not reference. This prevents false triggers from
// model re-evaluations that produce new array objects with identical contents.
const chainOptionsKey = computed(() => {
  const options = app.model.outputs.chainOptions;
  if (!options || options.length === 0) return '';
  return options.map((opt) => opt.label).join('\0');
});

// Auto-select all chains when options genuinely change (e.g., run switch or initial load).
// Only triggers when selectedChainRefs is empty — avoids overriding manual deselections.
watch(chainOptionsKey, () => {
  const options = app.model.outputs.chainOptions;
  if (!options || options.length === 0) return;
  if (app.model.args.selectedChainRefs.length === 0) {
    app.model.args.selectedChainRefs = options.map((opt) => opt.value);
  }
}, { immediate: true });

// Clear dependent args when the user switches to a different MiXCR run
function setMixcrRun(newRef: PlRef | undefined) {
  app.model.args.inputRef = newRef;
  app.model.args.selectedChainRefs = [];
  app.model.args.numberingScheme = undefined;
  app.model.args.clonotypeDefinition = [];
}

// Chain labels from the workflow that produced the last results.
// These are always in sync with the stats indices regardless of current UI selection.
const chainLabels = computed(() => (app.model.outputs.runChainLabels as string[] | undefined) ?? []);

// Detect stale results: snapshot the inputRef when stats arrive, then compare against
// the current selection. Hides results when the user switches datasets before the new run completes.
const resultsRunRef = ref<unknown>(undefined);
watch(() => app.model.outputs.perChainStats, (stats) => {
  if (stats && stats.length > 0) {
    resultsRunRef.value = JSON.stringify(app.model.args.inputRef);
  }
}, { immediate: true });
const resultsMatchCurrentArgs = computed(() => {
  if (!resultsRunRef.value) return false;
  return resultsRunRef.value === JSON.stringify(app.model.args.inputRef);
});

// True if at least one chain produced an ANARCI log
const hasAnyAnarciLog = computed(() =>
  app.model.outputs.perChainAnarciLog?.some((log) => log != null) ?? false,
);

// --- ANARCI log modal: one tab per chain that has a log ---

// Build tab options from chain labels, filtering to chains that actually have logs
const anarciLogTabOptions = computed(() =>
  chainLabels.value
    .map((label, i) => ({ label, value: String(i) }))
    .filter((_, i) => app.model.outputs.perChainAnarciLog?.[i] != null),
);

// Track active tab; reset to first available if current tab disappears (e.g., chain deselected)
const activeAnarciTab = ref<string>('0');
watch(anarciLogTabOptions, (opts) => {
  if (opts.length > 0 && !opts.some((o) => o.value === activeAnarciTab.value)) {
    activeAnarciTab.value = opts[0].value;
  }
}, { immediate: true });

// Derive active chain's log and numbering stats from the selected tab index
const activeAnarciLogIdx = computed(() => Number(activeAnarciTab.value));
const activeAnarciLog = computed(() => app.model.outputs.perChainAnarciLog?.[activeAnarciLogIdx.value]);
const activeAnarciNumberingStats = computed(() => app.model.outputs.perChainNumberingStats?.[activeAnarciLogIdx.value]);

// Per-chain numbering warning message. Warns when ANARCI couldn't number many clonotypes.
function numberingWarningForChain(ns: { total: number; numbered: number } | undefined) {
  if (!ns) return undefined;
  if (ns.numbered === 0) {
    return `ANARCI could not number any of the ${ns.total.toLocaleString()} clonotypes. The framework regions may be too divergent from known germline sequences.`;
  }
  if (ns.numbered < ns.total * 0.5) {
    return `ANARCI could only number ${ns.numbered.toLocaleString()} of ${ns.total.toLocaleString()} clonotypes. The framework regions may be divergent from known germline sequences. Unnumbered clonotypes are excluded from the output.`;
  }
  return undefined;
}

</script>

<template>
  <PlBlockPage
    v-model:subtitle="app.model.args.customBlockLabel"
    :subtitle-placeholder="app.model.args.defaultBlockLabel"
    title="Redefine Clonotypes"
  >
    <!-- Input selection: MiXCR run → chains → definition columns -->
    <PlDropdownRef
      v-model="app.model.args.inputRef"
      label="MiXCR Run"
      :options="app.model.outputs.inputOptions"
      @update:model-value="setMixcrRun"
    />

    <!-- Only shown when multiple chains available (single-cell with multiple receptor types) -->
    <PlDropdownMulti
      v-if="showChainSelector"
      v-model="app.model.args.selectedChainRefs"
      label="Select Chains"
      :options="app.model.outputs.chainOptions"
      :disabled="!app.model.args.inputRef"
    />

    <PlDropdownMulti
      v-model="app.model.args.clonotypeDefinition"
      label="New clonotype definition"
      :options="app.model.outputs.clonotypeDefinitionOptions"
      :disabled="app.model.args.selectedChainRefs.length === 0"
    >
      <template v-if="showChainSelector" #tooltip>
        In single-cell data, both chains (A and B) will be redefined using the same selected features.
      </template>
    </PlDropdownMulti>
    <PlAccordionSection label="Advanced Settings">
      <PlDropdown
        v-if="numberingAvailable"
        v-model="app.model.args.numberingScheme"
        label="Numbering schema"
        placeholder="None"
        :options="numberingSchemeOptions"
        :disabled="numberingDisabled"
        :clearable="true"
      >
        <template #tooltip>
          Apply IMGT, Kabat, or Chothia numbering. Requires datasets with VDJRegion or VDJRegionInFrame sequences or assembled on CDR3 (In this case, only the CDR3 region will be numbered). Transformed features are used for clonotype definition.
        </template>
      </PlDropdown>

      <PlSectionSeparator>Resource Allocation</PlSectionSeparator>
      <PlNumberField
        v-model="app.model.args.mem"
        label="Memory (GiB)"
        :minValue="1"
        :step="1"
        :maxValue="1012"
      >
        <template #tooltip>
          Sets the amount of memory to use for the computation.
        </template>
      </PlNumberField>

      <PlNumberField
        v-model="app.model.args.cpu"
        label="CPU (cores)"
        :minValue="1"
        :step="1"
        :maxValue="128"
      >
        <template #tooltip>
          Sets the number of CPU cores to use for the computation.
        </template>
      </PlNumberField>
    </PlAccordionSection>

    <!-- Validation message when inputs are incomplete -->
    <PlAlert v-if="!isValid" type="info">
      Please select a MiXCR run, chains, and a new clonotype definition.
    </PlAlert>

    <!-- Results section: shown only when not running and results match the current selection -->
    <template v-else-if="!app.model.outputs.isRunning && resultsMatchCurrentArgs">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <h3>Results</h3>
        <PlBtnGhost v-if="hasAnyAnarciLog" @click.stop="() => (anarciLogOpen = true)">
          ANARCI Log
          <template #append>
            <PlMaskIcon24 name="file-logs" />
          </template>
        </PlBtnGhost>
      </div>

      <!-- Per-chain stats: one block per chain from the last run -->
      <div v-for="(stats, chainIdx) in app.model.outputs.perChainStats" :key="chainIdx" class="results">
        <!-- Chain label header only shown when multiple chains were processed -->
        <h4 v-if="chainLabels.length > 1" style="margin: 0 0 4px 0;">{{ chainLabels[chainIdx] }}</h4>
        <PlAlert v-if="stats && stats.nClonotypesBefore === 0" type="warn">
          The input dataset is empty. Please choose a different dataset.
        </PlAlert>
        <template v-else>
          <PlAlert v-if="numberingWarningForChain(app.model.outputs.perChainNumberingStats?.[chainIdx])" type="warn">
            {{ numberingWarningForChain(app.model.outputs.perChainNumberingStats?.[chainIdx]) }}
          </PlAlert>
          <p>Input clonotypes: {{ stats?.nClonotypesBefore?.toLocaleString() ?? 'N/A' }}</p>
          <!-- ANARCI numbering: show count of successfully numbered clonotypes -->
          <p v-if="app.model.args.numberingScheme !== undefined && app.model.outputs.perChainNumberingMethod?.[chainIdx] === 'anarci'">
            Successfully numbered with ANARCI: {{ app.model.outputs.perChainNumberingStats?.[chainIdx]?.numbered?.toLocaleString() ?? 'N/A' }}
          </p>
          <!-- CDR3 numbering: all clonotypes are "numbered" (trimming only, no alignment) -->
          <p v-else-if="app.model.args.numberingScheme !== undefined && app.model.outputs.perChainNumberingMethod?.[chainIdx] === 'cdr3'">
            Successfully numbered based on CDR3
          </p>
          <p>Output clonotypes after redefinition: {{ stats?.nClonotypesAfter?.toLocaleString() ?? 'N/A' }}</p>
        </template>
      </div>
    </template>

    <!-- ANARCI log slide modal: tabbed per chain when multiple chains have logs -->
    <PlSlideModal v-model="anarciLogOpen" width="80%">
      <template #title>ANARCI Log</template>
      <!-- Tabs only shown when more than one chain has a log -->
      <PlTabs
        v-if="anarciLogTabOptions.length > 1"
        v-model="activeAnarciTab"
        :options="anarciLogTabOptions"
      />
      <!-- Unnumbered sequence samples for the active tab's chain -->
      <pre v-if="activeAnarciNumberingStats?.unnumberedSamples?.length" style="padding: 16px; font-size: 12px; border-bottom: 1px solid var(--pl-color-border, #ddd);">Sample of un-numbered sequences ({{ activeAnarciNumberingStats.unnumberedSamples.length }}):
      <template v-for="(sample, idx) in activeAnarciNumberingStats.unnumberedSamples" :key="idx">{{ sample }}
      </template></pre>
      <!-- Log stream for the active tab's chain -->
      <PlLogView v-if="activeAnarciLog" :log-handle="activeAnarciLog"/>
    </PlSlideModal>
  </PlBlockPage>
</template>
