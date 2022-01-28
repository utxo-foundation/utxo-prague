import { UTXOEngine } from "./engine.js";

const utxo = new UTXOEngine();
await utxo.init();

let cmd = Deno.args[0] || "build";
let args = Deno.args.slice(1) || [];

const output = await utxo[cmd](...args);
if (output) {
  console.log(output);
}
