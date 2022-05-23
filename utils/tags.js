import { UTXOEngine } from "./engine.js";

const utxo = new UTXOEngine({ silent: true });
await utxo.init();
const entry = utxo.entries["22"];

function run() {
  const tags = [];
  for (const ev of entry.specs.events) {
    tags.push(...ev.tags);
  }
  console.log(
    tags.map((t) => t.includes(" ") ? t.replace(" ", "-") : t).join(" "),
  );
}

run();
