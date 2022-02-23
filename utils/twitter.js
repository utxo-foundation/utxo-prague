import { config } from "https://deno.land/x/dotenv/mod.ts";
import SimpleTwitter from "https://deno.land/x/simple_twitter_deno@0.05/simple_twitter_deno.ts";
import { Table } from "https://deno.land/x/cliffy@v0.20.1/table/mod.ts";
import { UTXOEngine } from "./engine.js";
import { exists } from "https://deno.land/std/fs/mod.ts";
import { fromStreamReader } from "https://deno.land/std@0.60.0/io/streams.ts";

const utxo = new UTXOEngine({ silent: true });
await utxo.init();

config({ path: ".env", export: true });

const twitterImagesPath = "./spec/22/photos/";

const simple_twitter = new SimpleTwitter({
  consumer_key: Deno.env.get("CONSUMER_KEY"),
  consumer_secret: Deno.env.get("CONSUMER_SECRET"),
  access_token: Deno.env.get("ACCESS_TOKEN"),
  access_token_secret: Deno.env.get("ACCESS_TOKEN_SECRET"),
  bearer_token: Deno.env.get("BEARER_TOKEN"),
});

const entryId = "22";
const entry = utxo.entries[entryId];

const collections = ["speakers", "partners", "projects"];

const arr = [];
let total = 0;
let items = [];

async function fetchImageAndSave(tw, imageFn) {
  if (!await exists(imageFn)) {
    const url = tw.profile_image_url_https.replace("_normal", "");
    const res = await fetch(url);
    const file = await Deno.open(imageFn, { create: true, write: true });
    const reader = fromStreamReader(res.body.getReader());
    await Deno.copy(reader, file);
    file.close();
    console.log(`Saved file: ${imageFn} (url=${url})`);
  }
}

for (const col of collections) {
  for (const sp of entry.specs[col]) {
    if (!sp.twitter) {
      continue;
    }
    if (
      Deno.args[0] === "photos" && sp.photos.find((x) => x.match(/^twitter:/))
    ) {
      continue;
    }

    let tw;

    try {
      tw = await twitterUser(sp.twitter);
      if (!tw) {
        continue;
      }
    } catch (e) {
      console.log(sp.twitter, e)
      Deno.exit(1)
    }

    await fetchImageAndSave(
      tw,
      twitterImagesPath + col + "/" + sp.id + "-twitter.jpg",
    );

    items.push([
      `${col}${sp.type ? ":" + sp.type : ""}`,
      tw.screen_name,
      tw.followers_count,
    ]);
    total += tw.followers_count;
  }
}

arr.push(...items.sort((x, y) => x[2] < y[2] ? 1 : -1));

arr.push([]);
arr.push(["total", "", total]);

const table = Table.from(arr);

if (!Deno.args[0]) {
  console.log("\nTwitter followers count:\n\n" + table.toString() + "\n");
}

async function twitterUser(screen_name) {
  const resp = await simple_twitter.get("users/lookup", { screen_name });
  if (resp.length === 1) {
    return resp[0];
  }
  return null;
}
