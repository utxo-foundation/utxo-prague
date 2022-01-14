import { Table } from "https://deno.land/x/cliffy@v0.20.1/table/mod.ts";
import { UTXOEngine } from "./engine.js";

const utxo = new UTXOEngine({ silent: true });
await utxo.init();

const entryId = "22";
const entry = utxo.entries[entryId];

const tracksCount = {};
for (const sp of entry.specs.speakers) {
  for (const tr of sp.tracks) {
    if (!tracksCount[tr]) {
      tracksCount[tr] = 0;
    }
    tracksCount[tr]++;
  }
}
const tracks = entry.specs.tracks.map(
  (t) => [t.id, "|" + "+".repeat(tracksCount[t.id] || "0")],
);

const table = Table.from(tracks);
//table.border(true)

console.log(
  "\nRozložení jednotlivých tématických sekcí dle přednášejících:\n" +
    "-".repeat(60),
);
console.log(table.toString() + "\n");
