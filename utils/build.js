import { UTXOEngine } from "./engine.js";

const utxo = new UTXOEngine({ srcDir: "./spec" });
await utxo.init();

await utxo.build("./dist");
