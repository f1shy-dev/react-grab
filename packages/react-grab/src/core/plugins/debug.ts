import type { Plugin } from "../../types.js";

export const debugPlugin: Plugin = {
  name: "debug",
  actions: [
    {
      id: "debug",
      label: "Debug",
      shortcut: "D",
      enabled: (context) => Boolean(context.openRenderScanDetails),
      onAction: async (context) => {
        if (!context.openRenderScanDetails) {
          return;
        }
        const didOpenDetails = await context.openRenderScanDetails();
        if (!didOpenDetails) {
          return;
        }
        context.hideContextMenu();
      },
    },
  ],
};