import { platforma } from "@platforma-open/milaboratories.redefine-clonotypes.model";
import { defineAppV3 } from "@platforma-sdk/ui-vue";
import { computed, watch } from "vue";
import MainPage from "./pages/MainPage.vue";

export const sdkPlugin = defineAppV3(platforma, (app) => {
  syncSubtitleLabel(app.model);

  return {
    progress: () => {
      return app.model.outputs.isRunning;
    },
    routes: {
      "/": () => MainPage,
    },
  };
});

export const useApp = sdkPlugin.useApp;

type AppModel = ReturnType<typeof useApp>["model"];

// The subtitle names the chosen definition columns as the result pool labels them.
function syncSubtitleLabel(model: AppModel) {
  const subtitleLabel = computed<string | undefined>(() => {
    const options = model.outputs.clonotypeDefinitionOptions;
    const labels: string[] = [];
    for (const id of model.data.clonotypeDefinition) {
      const label = options?.find((o) => o.value === id)?.label;
      if (label === undefined) return undefined;
      labels.push(label.replace("InFrame", "").trim());
    }
    return labels.filter(Boolean).join("-");
  });

  watch(
    subtitleLabel,
    (label) => {
      if (label !== undefined && label !== model.data.subtitleLabel) {
        model.data.subtitleLabel = label;
      }
    },
    { immediate: true },
  );
}
