import { assertEquals } from "https://deno.land/std@0.119.0/testing/asserts.ts";
import { UTXOEngine } from "./engine.js";
import { getDate, isPeriodOverlap } from "./periods.js";

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
    if (["schedule"].includes(specId)) {
      Deno.test(`UTXO.${entryId}: ${specId}[rules]`, () => {
        const usedEvs = [];
        for (const item of entry.specs[specId]) {
          const ev = entry.specs.events.find((e) => e.id === item.event);

          // fixed.date
          if (ev.fixed && ev.fixed.date) {
            const evDate = getDate(item.period.start);
            if (evDate !== ev.fixed.date) {
              throw new Error(
                `Break fixed date [${ev.id}] - fixed: ${ev.fixed.date}, scheduled: ${evDate}`,
              );
            }
          }

          // fixed.stage
          if (ev.fixed && ev.fixed.stage && ev.fixed.stage !== item.stage) {
            throw new Error(
              `Break fixed.stage [${ev.id}] - fixed: ${ev.fixed.stage}, scheduled: ${item.stage}`,
            );
          }

          // paralel events for speakers
          for (
            const si of entry.specs[specId].filter((e) => e.id !== item.id)
          ) {
            if (!isPeriodOverlap(item.period, si.period)) {
              continue;
            }
            const sev = entry.specs.events.find((e) => e.id === si.event);
            for (const sp of sev.speakers) {
              if (ev.speakers.includes(sp)) {
                throw new Error(
                  `Speaker have overlapping events [${sp}]: ${ev.id} + ${sev.id}`,
                );
              }
            }
          }

          // availability rules
          for (const sp of ev.speakers) {
            const speaker = entry.specs.speakers.find((s) => s.id === sp);
            if (!speaker.available || speaker.available.length === 0) {
              continue;
            }
            let ok = false;
            for (const av of speaker.available) {
              const period = { start: av.from, end: av.to };
              if (isPeriodOverlap(item.period, period)) {
                ok = true;
              }
            }
            if (!ok) {
              throw new Error(
                `Speaker availability rule break [${sp}]: ${
                  JSON.stringify(item.period)
                }`,
              );
            }
          }

          for (
            const si of entry.specs[specId].filter((e) =>
              e.stage === item.stage && item.id !== e.id
            )
          ) {
            if (isPeriodOverlap(item.period, si.period)) {
              throw new Error(
                `Overlapping events on same stage (?): ${item.event} vs ${si.event}`,
              );
            }
          }

          if (usedEvs.includes(ev.id)) {
            throw new Error(`Duplicate event (?): ${ev.id}`);
          }

          usedEvs.push(ev.id);
        }
        for (
          const ev of entry.specs.events.filter((s) =>
            !["lightning"].includes(s.type)
          )
        ) {
          if (!usedEvs.includes(ev.id)) {
            throw new Error(`Event not found in schedule: ${ev.id}`);
          }
        }
      });
    }
  }
}
