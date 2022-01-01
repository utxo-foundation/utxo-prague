import { ensureDir } from "https://deno.land/std@0.119.0/fs/mod.ts";
import { copy } from "https://deno.land/std@0.119.0/fs/copy.ts";
import { load } from 'https://deno.land/x/js_yaml_port/js-yaml.js'

const srcDir = './spec/22'
const outputDirBase = './dist'
const outputDir = outputDirBase + '/22'

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

console.log('Copying photos..')
copy(srcDir + '/photos', outputDir + '/photos', { overwrite: true })
copy('./index.json', outputDirBase + '/index.json', { overwrite: true })

console.log('done')
