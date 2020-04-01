const childProcess = require('child_process')
const assert = require('assert')

if (process.env.CHILD) {
  (function main () {
    throw new Error('foo')
  })()
}

const { stdout, stderr } = childProcess.spawnSync(process.execPath, ['-r', 'source-map-support/register', __filename], {
  env: { ...process.env, CHILD: 'YES' },
  encoding: 'utf8'
})

try {
  assert(stderr.match('entry.ts'))
} catch (e) {
  process.stdout.write(stdout)
  process.stderr.write(stderr)
  throw e
}
