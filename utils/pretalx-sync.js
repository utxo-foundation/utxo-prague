import { config } from "https://deno.land/x/dotenv/mod.ts";
import { UTXOEngine } from "./engine.js";
import { dump } from "https://deno.land/x/js_yaml_port@3.14.0/js-yaml.js";

config({ path: ".env", export: true });

const utxo = new UTXOEngine({ silent: true });
await utxo.init();

const [entry, cmd] = Deno.args;
const speakers = utxo.entries[entry].specs.speakers;

function findSpeaker(pretalxId, name) {
  const res = speakers.find((s) => s.pretalxId === pretalxId);
  if (!res) {
    console.error(`Warning: Non-existing speaker: ${pretalxId} ${name}`);
    return null;
  }
  return res.id;
}
function findType(pretalxId) {
  const res = utxo.entries[entry].specs["event-types"].find((et) =>
    et.pretalxId === pretalxId
  );
  return res ? res.id : undefined;
}

function findTrack(pretalxId) {
  const res = utxo.entries[entry].specs.tracks.find((t) =>
    t.name === pretalxId
  );
  return res ? res.id : undefined;
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
    for (const item of json.results) {
      const i = {
        id: item.code.toLowerCase(),
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
    }
    const fn = `./spec/${entry}/events.yaml`;
    await Deno.writeTextFile(fn, dump(out));
    console.log(`Done: ${fn}`);
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
