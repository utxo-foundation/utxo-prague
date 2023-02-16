const mediaKitDir = "spec/23/media-kit";

async function makePNG(fname, opt = { width: 500 }) {
  const fn = mediaKitDir + "/" + fname;
  const fnr = mediaKitDir + "/generated/" +
    fname.replace(".svg", `-${opt.width}px.png`);

  console.log(`${fn}\n  => ${fnr}`);
  const p = Deno.run({
    cmd: [
      "bash",
      "-c",
      `/opt/homebrew/bin/rsvg-convert -w ${opt.width} ${fn} > ${fnr}`,
    ],
  });
  const resp = await p.status();
  console.log(resp);
}

for await (const f of Deno.readDir(mediaKitDir)) {
  if (!f.name.match(/.svg$/)) {
    continue;
  }
  await makePNG(f.name, { width: 250 });
  await makePNG(f.name, { width: 500 });
  await makePNG(f.name, { width: 1000 });
}
