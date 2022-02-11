import { UTXOEngine } from "./engine.js";

const utxo = new UTXOEngine({ silent: true });
await utxo.init();

const entryId = "22";
const entry = utxo.entries[entryId];

const pt = entry.specs.team.teams;
const teams = Object.keys(pt).map((id) => Object.assign({ id }, pt[id]));

console.log("----");

function members(t) {
  return t.members.map((m) => m === t.lead ? "@" + m : m).sort((m) =>
    m.substring(0, 1) === "@" ? -1 : 1
  ).join(", ");
}

for (const t of teams.filter((t) => !t.parent)) {
  console.log((t.id === "core" ? "" : " ") + `[${t.id}] +${members(t)}`);
  for (const st of teams.filter((tx) => tx.parent === t.id)) {
    console.log(`  [${st.id}] +${members(st)}`);
    for (const st2 of teams.filter((tx2) => tx2.parent === st.id)) {
      console.log(`   [${st2.id}] +${members(st2)}`);
    }
  }
}
