import { UTXO } from "./utxo.lib.js"

const utxo = new UTXO({ srcDir: './spec' })
await utxo.init()

await utxo.build('./dist')

