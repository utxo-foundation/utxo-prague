import { UTXOEngine } from "./engine.js";

const utxo = new UTXOEngine();
await utxo.init();

let cmd = Deno.args[0] || "build";
let args = Deno.args.slice(1) || [];

await utxo[cmd](...args);
