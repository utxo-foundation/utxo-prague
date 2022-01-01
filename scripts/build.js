import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import { load } from 'https://deno.land/x/js_yaml_port/js-yaml.js'

const srcDir = './src'
const outputDir = './dist'

await ensureDir(outputDir)

for await (const f of Deno.readDir(srcDir)) {
  const m = f.name.match(/^(.+)\.yaml$/)
  if (!m) {
    continue
  }
  const yaml = load(await Deno.readTextFile(srcDir + '/' + f.name))
  const outputFn = outputDir + '/' + m[1] + '.json'
  await Deno.writeTextFile(outputFn, JSON.stringify(yaml, null, 2))
  console.log(`${outputFn} writed`)
}

console.log('done')
