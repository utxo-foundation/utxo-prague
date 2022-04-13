import { UTXOEngine } from "./engine.js";
import { markdownTable } from "https://cdn.skypack.dev/markdown-table@3?dts";

const utxo = new UTXOEngine({ silent: true });
await utxo.init();

// get 2022
const entry = utxo.entries["22"];

// SPEAKERS
//const speakers = entry.specs.speakers;
//const sortedSpeakers = speakers.sort((a, b) => a.name.localeCompare(b.name));
const tracks = entry.specs.tracks;

const methods = {
  // SPEAKERS - table
  /*async speakersTableGen() {
    const speakersTableArr = [["Jméno", "Organizace"]];
    for (const speaker of sortedSpeakers) {
      const name = `**${speaker.name}**`;
      speakersTableArr.push([
        (speaker.twitter
          ? `[${name}](https://twitter.com/${speaker.twitter})`
          : name) + (speaker.nickname ? ` (${speaker.nickname})` : ""),
        speaker.orgs ? speaker.orgs.trim() : "",
      ]);
    }
    const speakersTable =
      `Celkem přednášejících: **${speakers.length}**\n\n_(abecedně)_\n\n` +
      markdownTable(speakersTableArr);
    //console.log(speakersTable)
    return speakersTable;
  },

  // SPEAKERS - leads
  async speakersLeadsGen() {
    const speakersLeadsArr = [];
    for (const speaker of sortedSpeakers.filter((speaker) => speaker.lead)) {
      const orgs = speaker.orgs ? `\n* ${speaker.orgs.trim("\n")}` : "";
      const socials = [];
      if (speaker.twitter) {
        socials.push(
          `Twitter: [@${speaker.twitter}](https://twitter.com/${speaker.twitter})`,
        );
      }
      if (speaker.web) {
        socials.push(
          `Web: [${
            speaker.web.name ? speaker.web.name : speaker.name
          }](${speaker.web.url})`,
        );
      }
      const img =
        `![](https://spec.utxo.cz/22/photos/speakers/${speaker.id}-sm.png)`;
      const item = `### ${img} ${speaker.name}\n\n* ${
        speaker.bio?.trim()
      }${orgs}\n* ${socials.join(", ")}`;
      speakersLeadsArr.push(item);
    }

    const speakersLeads = `_(abecedně)_\n\n` + speakersLeadsArr.join("\n\n");
    //console.log(speakersLeads)
    return speakersLeads;
  },

  // SPEAKERS - write file

  async speakersBuild() {
    const speakersDocFile = "./docs/prednasejici.md";
    const speakersText = await Deno.readTextFile(speakersDocFile);
    let output = speakersText;
    output = output.replace(
      /## Významní hosté([\s\S]+)## Seznam/m,
      `## Významní hosté\n\n${await methods.speakersLeadsGen()}\n\n## Seznam`,
    );
    output = output.replace(
      /## Seznam všech přednášejících([\s\S]+)### Datový/m,
      `## Seznam všech přednášejících\n\n${await methods
        .speakersTableGen()}\n\n### Datový`,
    );
    await Deno.writeTextFile(speakersDocFile, output);
  },*/

  // TRACKS
  async tracksGen() {
    const output = [];
    for (const track of tracks) {
      output.push(
        `<details>\n\n<summary>${track.name}</summary>\n\n${track.examples.trim()}\n\n</details>`,
      );
    }

    return `Přednášky a workshopy budou rozděleny do **${tracks.length} tématických programových sekcí**. Níže naleznete jejich přehled a relevantní příklady.\n\n` +
      output.join("\n\n");
  },

  async tracksBuild() {
    const sourceFile = "./docs/hlavni-program.md";
    const sourceText = await Deno.readTextFile(sourceFile);
    let output = sourceText;
    output = output.replace(
      /## Programové sekce([\s\S]+)## Časová/m,
      `## Programové sekce\n\n${await methods.tracksGen()}\n\n## Časová`,
    );
    await Deno.writeTextFile(sourceFile, output);
  },

  /*// FAQs
  async faqsGen() {
    const output = [];
    for (const item of entry.specs.faqs) {
      output.push(
        `<details>\n\n<summary>${item.question.trim()}</summary>\n\n${item.answer.trim()}\n\n</details>`,
      );
    }
    return output.join("\n\n");
  },

  async faqsBuild() {
    const docFile = "./docs/faq.md";
    const docText = await Deno.readTextFile(docFile);
    const faqs = await this.faqsGen();
    let output = docText;
    output = output.replace(/# FAQ[\s\S]+/m, `# FAQ\n\n${faqs}\n`);

    // TODO replace
    await Deno.writeTextFile(docFile, output);
  },*/

  // PARTNERS
  async partnersGen(type = "community") {
    const arr = [["Název", "Popis"]];
    for (const item of entry.specs.partners.filter((p) => p.type === type)) {
      arr.push([
        `[**${item.name}**](${
          item.twitter ? "https://twitter.com/" + item.twitter : item.web?.url
        })`,
        item.desc,
      ]);
    }
    const table = markdownTable(arr);
    return table;
  },

  async partnersBuild() {
    const docFile = "./docs/partneri.md";
    const docText = await Deno.readTextFile(docFile);
    let output = docText;
    output = output.replace(
      /## Spolupracující komunity([\s\S]+)## Mediální/m,
      `## Spolupracující komunity\n\n${await methods.partnersGen(
        "community",
      )}\n\n## Mediální`,
    );
    output = output.replace(
      /## Mediální partneři([\s\S]+)/m,
      `## Mediální partneři\n\n${await methods.partnersGen("medium")}\n\n`,
    );
    await Deno.writeTextFile(docFile, output);

    const docFile2 = "./docs/sponzori.md";
    const docText2 = await Deno.readTextFile(docFile2);
    let output2 = docText2;
    output2 = output2.replace(
      /## Seznam sponzorů([\s\S]+)/m,
      `## Seznam sponzorů\n\n${await methods.partnersGen("sponsor")}\n\n`,
    );
    await Deno.writeTextFile(docFile2, output2);
  },
};

if (!Deno.args[0]) {
  //await methods.speakersBuild();
  await methods.tracksBuild();
  //await methods.faqsBuild();
  await methods.partnersBuild();
  console.log("done");
} else {
  console.log(await methods[Deno.args[0]](Deno.args[1]));
}
