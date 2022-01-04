import { config } from "https://deno.land/x/dotenv/mod.ts"
import SimpleTwitter from "https://deno.land/x/simple_twitter_deno@0.05/simple_twitter_deno.ts"
import { Table } from "https://deno.land/x/cliffy@v0.20.1/table/mod.ts"
import { UTXOEngine } from './engine.js'

const utxo = new UTXOEngine({ silent: true })
await utxo.init()

config({ path: ".env", export: true })

const simple_twitter = new SimpleTwitter({
  consumer_key: Deno.env.get("CONSUMER_KEY"),
  consumer_secret: Deno.env.get("CONSUMER_SECRET"),
  access_token: Deno.env.get("ACCESS_TOKEN"),
  access_token_secret: Deno.env.get("ACCESS_TOKEN_SECRET"),
  bearer_token: Deno.env.get("BEARER_TOKEN")
})

const entryId = '22'
const entry = utxo.entries[entryId]

const arr = []
let total = 0

for (const sp of entry.specs.speakers) {
  if (!sp.twitter) {
    continue
  }
  const tw = await twitterUser(sp.twitter)
  if (!tw) {
    continue
  }
  arr.push([ tw.screen_name, tw.followers_count ])
  total += tw.followers_count
}

arr.push([])
arr.push([ 'total', total ])

const table = Table.from(arr)
console.log('\nTwitter followers count:\n\n' + table.toString() + '\n')

async function twitterUser(screen_name) {
  const resp = await simple_twitter.get("users/lookup", { screen_name })
  if (resp.length === 1) {
    return resp[0]
  }
  return null
}

