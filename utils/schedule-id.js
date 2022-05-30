import { UTXOEngine } from "./engine.js";
import { genId } from "./genid.js";

const utxo = new UTXOEngine({ silent: true });
await utxo.init();

const entryId = "22";
const entry = utxo.entries[entryId];

const id = genId(entry.specs.schedule.map((s) => s.id));
console.log(id);
