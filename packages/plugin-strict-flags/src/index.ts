// TODO: unit tests

import { definePlugin } from "@clerc/core";
import { semanticArray } from "@clerc/utils";

export const strictFlagsPlugin = () => definePlugin({
  setup: (cli) => {
    return cli.inspector((ctx, next) => {
      const keys = Object.keys(ctx.unknownFlags);
      if (!ctx.resolved || keys.length === 0) {
        next();
      } else {
        throw new Error(`Unexpected flag${keys.length > 1 ? "s" : ""}: ${semanticArray(keys)}`);
      }
    });
  },
});
