import { Table } from "https://deno.land/x/cliffy@v0.20.1/table/mod.ts";
import { UTXOEngine } from "./engine.js";

const utxo = new UTXOEngine({ silent: true });
await utxo.init();

const entryId = "22";
const entry = utxo.entries[entryId];

const speakers = entry.specs.speakers;

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
const totals = {
  items: 0,
  duration: 0,
  speakers: {},
};

for (const item of entry.specs.events) {
  const out = [];
  for (const sc of setup) {
    out.push(sc.process ? sc.process(item) : item[sc.col]);
  }
  arr.push(out);
  totals.items++;
  totals.duration += item.duration || 0;
  //console.log(JSON.stringify(item.speakers))
  for (const sid of item.speakers) {
    if (!totals.speakers[sid]) {
      totals.speakers[sid] = { duration: 0 };
    }
    totals.speakers[sid].duration += item.duration || 0;
  }
}

const totalSpeakers = Object.keys(totals.speakers).length;
const minutesPerSpeaker = totals.duration / totalSpeakers;
const durationPrediction = speakers.length / (totals.duration / 100) *
  speakers.length;

console.log(Table.from(arr).border(true).toString());
console.log(
  `Events: ${totals.items}, Speakers: ${totalSpeakers}/${speakers.length}, duration: ${totals.duration} minutes (${
    (totals.duration / 60).toFixed(2)
  } hours, estimated full: ${durationPrediction.toFixed(2)} hours), ` +
    `minutes per speaker: ${minutesPerSpeaker.toFixed(2)} min`,
);
