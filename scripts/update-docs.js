import { load } from 'https://deno.land/x/js_yaml_port/js-yaml.js'
import {markdownTable} from 'https://cdn.skypack.dev/markdown-table@3?dts'

// SPEAKERS
const speakers = load(await Deno.readTextFile('./src/speakers.yaml'))

// SPEAKERS - table
const speakersTableArr = [[ 'Jméno', 'Organizace' ]]
for (const speaker of speakers) {
  speakersTableArr.push([ 
    (speaker.twitter ? `[${speaker.name}](https://twitter.com/${speaker.twitter})` : speaker.name) + (speaker.nickname ? ` (${speaker.nickname})` : ''),
    speaker.orgs
  ])
}
const speakersTable = `_(abecedně)_\n\n` + markdownTable(speakersTableArr, { alignDelimiters: false })
//console.log(speakersTable)

// SPEAKERS - leads
const speakersLeadsArr = []
for (const speaker of speakers.filter(speaker => speaker.lead)) {
  const orgs = speaker.orgs ? `\n* ${speaker.orgs}` : `\n`
  const socials = []
  if (speaker.twitter) {
    socials.push(`Twitter: [@${speaker.twitter}](https://twitter.com/${speaker.twitter})`)
  }
  if (speaker.web) {
    socials.push(`Web: [${speaker.web.name ? speaker.web.name : speaker.name}](${speaker.web.url})`)
  }
  const img = `![](https://spec.utxo.cz/photos/speakers/${speaker.id}.png)`
  const item = `### ${img} ${speaker.name}\n\n* ${speaker.bio.trim()}${orgs}* ${socials.join(', ')}`;
  speakersLeadsArr.push(item)
}

const speakersLeads = `_(abecedně)_\n\n` + speakersLeadsArr.join('\n\n')
//console.log(speakersLeads)

// SPEAKERS - write file
const speakersDocFile = './docs/prednasejici.md'
const speakersText = await Deno.readTextFile(speakersDocFile)
let output = speakersText.replace(/## Seznam všech přednášejících([\s\S]+)/m, `## Seznam všech přednášejících\n\n${speakersTable}`)
output = output.replace(/## Významní hosté([\s\S]*)## /m, `## Významní hosté\n\n${speakersLeads}\n\n## `)
await Deno.writeTextFile(speakersDocFile, output)

