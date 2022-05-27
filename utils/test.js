import { assertEquals } from "https://deno.land/std@0.119.0/testing/asserts.ts";
import { UTXOEngine } from "./engine.js";

// initialize ajv JSON Schema validator
import Ajv from "https://esm.sh/ajv@8.8.1?pin=v58";
import addFormats from "https://esm.sh/ajv-formats@2.1.1";

const ajv = new Ajv();
addFormats(ajv);

const utxo = new UTXOEngine({ silent: true });
await utxo.init();
const schemas = await utxo.schemas();

const validators = {};
for (const item of schemas) {
  validators[item.name] = ajv.compile(item.schema);
}

// check entries
for (const entryId of utxo.entriesList()) {
  const entry = utxo.entries[entryId];

  // check index
  Deno.test(`UTXO.${entryId}: index[schema]`, () => {
    if (!validators.index(entry.index)) {
      throw validators.index.errors;
    }
  });

  // check specific specs
  for (const specId of Object.keys(entry.specs)) {
    Deno.test(`UTXO.${entryId}: ${specId}[schema]`, () => {
      if (!validators[specId]) {
        return null;
      }
      if (!validators[specId](entry.specs[specId])) {
        throw validators[specId].errors;
      }
    });

    if (!["team"].includes(specId)) {
      Deno.test(`UTXO.${entryId}: ${specId}[id-duplicates]`, () => {
        const used = [];
        for (const item of entry.specs[specId]) {
          if (!item.id) {
            return null;
          }
          if (used.includes(item.id)) {
            throw `Duplicate key: ${item.id}`;
          }
          used.push(item.id);
        }
      });
    }

    if (["speakers", "projects"].includes(specId)) {
      Deno.test(`UTXO.${entryId}: ${specId}[tracks-links]`, () => {
        const tracks = entry.specs.tracks.map((t) => t.id);
        for (const item of entry.specs[specId]) {
          if (!item.tracks) {
            continue;
          }
          for (const t of item.tracks) {
            if (!tracks.includes(t)) {
              throw new Error(`Track not exists: ${t}`);
            }
          }
        }
      });
    }
    if (["events"].includes(specId)) {
      Deno.test(`UTXO.${entryId}: ${specId}[speakers-links]`, () => {
        const speakers = entry.specs.speakers.map((t) => t.id);
        for (const item of entry.specs[specId]) {
          if (!item.speakers || item.speakers.length === 0) {
            continue;
          }
          for (const t of item.speakers) {
            if (!speakers.includes(t)) {
              throw new Error(`Speaker not exists: ${t}`);
            }
          }
        }
      });
    }
    if (["team"].includes(specId)) {
      Deno.test(`UTXO.${entryId}: ${specId}[persons-links]`, () => {
        const persons = Object.keys(entry.specs.team.persons);
        for (const teamId of Object.keys(entry.specs[specId].teams)) {
          const team = entry.specs[specId].teams[teamId];
          if (
            team.parent &&
            !Object.keys(entry.specs.team.teams).includes(team.parent)
          ) {
            throw new Error(`Parent not found: ${team.parent}`);
          }
          if (team.lead && !persons.includes(team.lead)) {
            throw new Error(`Lead not found: ${team.lead}`);
          }
          if (!team.members || team.members.length === 0) {
            continue;
          }
          for (const m of team.members) {
            if (!persons.includes(m)) {
              throw new Error(`Person not exists: ${m}`);
            }
          }
        }
      });
    }
    if (["events"].includes(specId)) {
      Deno.test(`UTXO.${entryId}: ${specId}[speakers-tracks]`, () => {
        const tracks = entry.specs.tracks.map((t) => t.id);
        for (const item of entry.specs[specId]) {
          if (!item.track) {
            continue;
          }
          if (!tracks.includes(item.track)) {
            throw new Error(`Track not exists: ${item.track}`);
          }
        }
      });
      Deno.test(`UTXO.${entryId}: ${specId}[fixed-stages]`, () => {
        const stages = entry.specs.stages.map((s) => s.id);
        for (const item of entry.specs[specId]) {
          if (item.fixed && item.fixed.stage) {
            if (!stages.includes(item.fixed.stage)) {
              throw new Error(`Stage not exists: ${item.fixed.stage}`);
            }
          }
          if (item.fixed && item.fixed.stages) {
            for (const st of item.fixed.stages) {
              if (!stages.includes(st)) {
                throw new Error(`Stage not exists: ${st}`);
              }
            }
          }
        }
      });
    }
  }
}
