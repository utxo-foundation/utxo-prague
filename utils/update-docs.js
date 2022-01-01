import { load } from 'https://deno.land/x/js_yaml_port/js-yaml.js'
import {markdownTable} from 'https://cdn.skypack.dev/markdown-table@3?dts'

// SPEAKERS
const speakers = load(await Deno.readTextFile('./spec/speakers.yaml'))
const tracks = load(await Deno.readTextFile('./spec/tracks.yaml'))

const methods = {

  // SPEAKERS - table
  async speakersTableGen () {

    const speakersTableArr = [[ 'Jméno', 'Organizace' ]]
    for (const speaker of speakers) {
      speakersTableArr.push([ 
        ('**' + (speaker.twitter ? `[${speaker.name}](https://twitter.com/${speaker.twitter})` : speaker.name) + '**') + (speaker.nickname ? ` (${speaker.nickname})` : ''),
        speaker.orgs ? speaker.orgs.trim() : ''
      ])
    }
    const speakersTable = `Celkem přednášejících: **${speakers.length}**\n\n_(abecedně)_\n\n` + markdownTable(speakersTableArr)
    //console.log(speakersTable)
    return speakersTable
  },

  // SPEAKERS - leads
  async speakersLeadsGen () {

    const speakersLeadsArr = []
    for (const speaker of speakers.filter(speaker => speaker.lead)) {
      const orgs = speaker.orgs ? `\n* ${speaker.orgs.trim('\n')}` : ''
      const socials = []
      if (speaker.twitter) {
        socials.push(`Twitter: [@${speaker.twitter}](https://twitter.com/${speaker.twitter})`)
      }
      if (speaker.web) {
        socials.push(`Web: [${speaker.web.name ? speaker.web.name : speaker.name}](${speaker.web.url})`)
      }
      const img = `![](https://spec.utxo.cz/22/photos/speakers/${speaker.id}-sm.png)`
      const item = `### ${img} ${speaker.name}\n\n* ${speaker.bio.trim()}${orgs}\n* ${socials.join(', ')}`;
      speakersLeadsArr.push(item)
    }

    const speakersLeads = `_(abecedně)_\n\n` + speakersLeadsArr.join('\n\n')
    //console.log(speakersLeads)
    return speakersLeads
  },

  // SPEAKERS - write file

  async speakersBuild () {
    const speakersDocFile = './docs/prednasejici.md'
    const speakersText = await Deno.readTextFile(speakersDocFile)
    let output = speakersText
    output = output.replace(/## Významní hosté([\s\S]+)## Seznam/m, `## Významní hosté\n\n${await methods.speakersLeadsGen()}\n\n## Seznam`)
    output = output.replace(/## Seznam všech přednášejících([\s\S]+)### Datový/m, `## Seznam všech přednášejících\n\n${await methods.speakersTableGen()}\n\n### Datový`)
    await Deno.writeTextFile(speakersDocFile, output)
  },

  // TRACKS
  async tracksGen () {

    const output = []
    for (const track of tracks) {
      output.push(`<details>\n\n<summary>${track.name}</summary>\n\n${track.examples.trim()}\n\n</details>`)
    }

    return `Přednášky a workshopy budou rozděleny do **${tracks.length} tématických programových sekcí**. Níže naleznete jejich přehled a relevantní příklady.\n\n` + output.join('\n\n')
  },

  async tracksBuild () {
    const sourceFile = './docs/hlavni-program.md'
    const sourceText = await Deno.readTextFile(sourceFile)
    let output = sourceText
    output = output.replace(/## Programové sekce([\s\S]+)## Časová/m, `## Programové sekce\n\n${await methods.tracksGen()}\n\n## Časová`)
    await Deno.writeTextFile(sourceFile, output)
  }
}

if (!Deno.args[0]) {
  await methods.speakersBuild()
  await methods.tracksBuild()
  console.log('done')
} else {
  console.log(await methods[Deno.args[0]]())
}

