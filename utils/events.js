import { Table } from "https://deno.land/x/cliffy@v0.20.1/table/mod.ts";
import { UTXOEngine } from "./engine.js";

const utxo = new UTXOEngine({ silent: true });
await utxo.init();

const entryId = "22";
const entry = utxo.entries[entryId];

const setup = [
  { col: "type", title: "Type" },
  { col: "id", title: "ID" },
  { col: "track", title: "Track" },
  { col: "name", title: "Name" },
  { col: "duration", title: "Len" },
  {
    col: "speakers",
    title: "Speakers", //process: (e) => e.speakers.map((s) => entry.specs.speakers.find((sp) => sp.id === s).name).join(", ")
  },
];
const arr = [setup.map((s) => s.title)];
//const types = [...new Set(entry.specs.events.map(e => e.type))]

for (const item of entry.specs.events) {
  const out = [];
  for (const sc of setup) {
    out.push(sc.process ? sc.process(item) : item[sc.col]);
  }
  arr.push(out);
}

console.log(Table.from(arr).border(true).toString());
