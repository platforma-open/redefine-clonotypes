import {
  getDefaultBlockLabel,
  platforma,
} from "@platforma-open/milaboratories.redefine-clonotypes.model";
import { defineAppV3 } from "@platforma-sdk/ui-vue";
import { watchEffect } from "vue";
import MainPage from "./pages/MainPage.vue";

export const sdkPlugin = defineAppV3(platforma, (app) => {
  syncDefaultBlockLabel(app.model);

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

function syncDefaultBlockLabel(model: AppModel) {
  watchEffect(() => {
    const clonotypeDefinitionLabels = model.data.clonotypeDefinition
      .map((colId) => {
        const option = model.outputs.clonotypeDefinitionOptions?.find((o) => o.value === colId);
        return option?.label || "";
      })
      .filter(Boolean);

    model.data.defaultBlockLabel = getDefaultBlockLabel({
      clonotypeDefinitionLabels,
    });
  });
}
