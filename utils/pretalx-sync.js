import { config } from "https://deno.land/x/dotenv/mod.ts";
import { UTXOEngine } from "./engine.js";
import { dump } from "https://deno.land/x/js_yaml_port@3.14.0/js-yaml.js";
import { genId } from "./genid.js";
import { format } from "https://deno.land/std@0.139.0/datetime/mod.ts";

config({ path: ".env", export: true });

const utxo = new UTXOEngine({ silent: true });
await utxo.init();

const [entry, cmd] = Deno.args;
const speakers = utxo.entries[entry].specs.speakers;

function findSpeaker(id, name) {
  const res = speakers.find((s) => s.pretalxId === id);
  if (!res) {
    console.error(`Warning: Non-existing speaker: ${id} ${name}`);
    return null;
  }
  return res.id;
}
function findType(id) {
  const res = utxo.entries[entry].specs["event-types"].find((et) =>
    et.pretalxId === id
  );
  return res ? res.id : undefined;
}

function findTrack(id) {
  const res = utxo.entries[entry].specs.tracks.find((t) => t.name === id);
  return res ? res.id : undefined;
}

function findStage(id) {
  const res = utxo.entries[entry].specs.stages.find((s) => s.pretalxId === id);
  return res ? res.id : undefined;
}

async function writeFile(fn, data) {
  await Deno.writeTextFile(fn, dump(data));
  console.log(`File written: ${fn}`);
}

const commands = {
  async talks() {
    const resp = await fetch(
      "https://pretalx.utxo.cz/api/events/23/submissions/?limit=200&state=confirmed",
      {
        headers: {
          Authorization: `Token ${Deno.env.get("PRETALX_TOKEN")}`,
        },
      },
    );
    const maps = { types: [], tracks: [] };
    const json = await resp.json();
    console.log(`confirmed proposal count: ${json.results.length}`);
    const out = [];
    const outSchedule = [];
    for (const item of json.results) {
      const eventId = item.code.toLowerCase();
      const i = {
        id: eventId,
        type: findType(item.submission_type.en),
        name: item.title,
        speakers: item.speakers.map((sp) => findSpeaker(sp.code, sp.name))
          .filter((sp) => sp),
        duration: item.duration,
        description: item.abstract,
      };
      if (item.track) {
        i.track = findTrack(item.track.en);
      }
      out.push(i);
      if (item.slot) {
        outSchedule.push({
          id: genId(outSchedule.map((o) => o.id)),
          stage: findStage(item.slot.room.en),
          event: eventId,
          date: format(new Date(item.slot.start), "yyyy-MM-dd"),
          period: {
            start: item.slot.start,
            end: item.slot.end,
          },
        });
      }
    }
    await writeFile(`./spec/${entry}/events.yaml`, out);
    await writeFile(`./spec/${entry}/schedule.yaml`, outSchedule);
  },
};

if (!cmd) {
  throw new Error("Error: Please supply command");
}
if (!commands[cmd]) {
  throw new Error("Error: Invalid command");
}

const specs = utxo.entries[entry].specs;
commands[cmd]();
