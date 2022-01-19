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
  Deno.test(`UTXO.${entryId}: index.yaml`, () => {
    if (!validators.index(entry.index)) {
      throw validators.index.errors;
    }
  });

  // check specific specs
  for (const specId of Object.keys(entry.specs)) {
    Deno.test(`UTXO.${entryId}: ${specId}`, () => {
      if (!validators[specId]) {
        return null;
      }
      if (!validators[specId](entry.specs[specId])) {
        throw validators[specId].errors;
      }
    });

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
  }
}
