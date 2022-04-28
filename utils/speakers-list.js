import { UTXOEngine } from "./engine.js";

const utxo = new UTXOEngine({ silent: true });
await utxo.init();
const specs = utxo.entries["22"].specs;

for (const sp of specs.speakers) {
  if (sp.lead) {
    continue;
  }
  console.log(sp.name + (sp.nickname ? ` (${sp.nickname})` : ""));
}
