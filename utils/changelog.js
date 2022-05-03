import { load } from "https://deno.land/x/js_yaml_port@3.14.0/js-yaml.js";
import { format } from "https://deno.land/std/datetime/mod.ts";

const cols = {
  speakers: { title: "Přednášející", url: "lide" },
  events: { title: "Události", url: "udalosti" },
  partners: { title: "Partneři", url: "#partneri" },
};
const types = {
  added: { title: "přidáno" },
  removed: { title: "odebráno" },
};

async function runCommand(cmd) {
  //console.log(cmd.join(' '))
  const p = await Deno.run({ cmd, stdout: "piped", stderr: "piped" });
  /*const pStatus = await p.status();
  if (pStatus.code !== 0) {
    const err = new TextDecoder().decode(await p.stderrOutput())
    throw err;
  }*/
  return new TextDecoder().decode(await p.output());
}

async function gitCommits() {
  const resp = await runCommand([
    "git",
    "--no-pager",
    "log",
    '--format=format:"%H;%cs"',
    "1ba66399e6989c038dc7d362d7bd2c7653a65512..origin/gh-pages",
  ]);
  return resp.split("\n").map((i) => {
    const [hash, date] = i.replace(new RegExp('^"(.+)"$'), "$1").split(";");
    return { hash, date };
  }).reverse();
}

async function gitCommitFile(commit, file) {
  let out;
  try {
    out = await runCommand([
      "git",
      "--no-pager",
      "show",
      `${commit.hash}:${file}`,
    ]);
  } catch (e) {
    return null;
  }
  return out;
}

function checkCol(col, d, current) {
  if (!d.json.spec[col] || !current.spec[col]) {
    return null;
  }
  for (const sp of d.json.spec[col]) {
    if (!current.spec[col].find((s) => s.id === sp.id)) {
      if (!d[col].added) {
        d[col].added = [];
      }
      d[col].added.push({ id: sp.id, name: sp.name });
    }
  }
  for (const sp of current.spec[col]) {
    if (!d.json.spec[col].find((s) => s.id === sp.id)) {
      if (!d[col].removed) {
        d[col].removed = [];
      }
      d[col].removed.push([sp.id, sp.name]);
    }
  }
}

async function generate(entry = "22") {
  const commits = await gitCommits();
  const bundleFn = `${entry}/bundle.json`;
  const dates = {};

  const basic = { json: { spec: {} } };
  for (const col of Object.keys(cols)) {
    basic[col] = {};
    basic.json.spec[col] = [];
  }
  dates["2022-01-01"] = basic;

  for (const commit of commits) {
    if (!dates[commit.date]) {
      const obj = { json: null };
      for (const col of Object.keys(cols)) {
        obj[col] = {};
      }
      dates[commit.date] = obj;
    }
    const file = await gitCommitFile(commit, bundleFn);
    if (!file) {
      continue;
    }
    dates[commit.date].json = JSON.parse(file);
  }

  // add today
  const today = format(new Date(), "yyyy-MM-dd");
  if (!dates[today]) {
    const obj = { json: null };
    for (const col of Object.keys(cols)) {
      obj[col] = {};
    }
    dates[today] = obj;
  }
  dates[today].json = JSON.parse(await Deno.readTextFile(`dist/${bundleFn}`));

  let current = null;
  const output = [];
  for (const date of Object.keys(dates)) {
    const d = dates[date];
    if (current) {
      for (const col of Object.keys(cols)) {
        checkCol(col, d, current);
      }
    }
    current = d.json;
    const obj = { date };
    for (const col of Object.keys(cols)) {
      obj[col] = d[col];
    }
    output.push(obj);
  }

  const fn = `./dist/${entry}/changelog.json`;
  await Deno.writeTextFile(fn, JSON.stringify(output, null, 2));
  console.log(`JSON writed to file: ${fn}`);

  const items = [];
  for (const d of output.reverse()) {
    const sitems = [];
    for (const col of Object.keys(cols)) {
      for (const type of Object.keys(types)) {
        const colitems = [];
        if (d[col][type]) {
          for (const i of d[col][type]) {
            colitems.push(
              `* ${types[type].title} [${i.name}](https://utxo.cz/${
                cols[col].url
              }?id=${i.id})`,
            );
          }
        }
        if (colitems.length > 0) {
          sitems.push(`### ${cols[col].title}\n\n${colitems.join("\n")}\n`);
        }
      }
    }
    if (sitems.length > 0) {
      items.push(
        `## ${format(new Date(d.date), "d.M.yyyy")}\n\n` + sitems.join("\n") +
          "\n",
      );
    }
  }
  const md = `# Changelog\n\n${items.join("\n")}`;
  const fnMd = `./dist/${entry}/CHANGELOG.md`;
  await Deno.writeTextFile(fnMd, md);
  console.log(`Markdown writed to file: ${fnMd}`);
}

generate();
