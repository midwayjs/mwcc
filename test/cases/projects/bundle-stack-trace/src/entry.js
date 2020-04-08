const assert = require('assert')
const childProcess = require('child_process')
const path = require('path');

(function main () {
  if (process.env.CHILD !== 'stack-trace') {
    const cp = childProcess.fork(__filename, [], {
      stdio: 'pipe',
      env: Object.assign({}, process.env, {
        CHILD: 'stack-trace'
      })
    })
    const stdoutBuffers = []
    cp.stdout.on('data', data => stdoutBuffers.push(data))

    cp.on('exit', (code) => {
      const stdout = Buffer.concat(stdoutBuffers).toString('utf8')
      if (code !== 0) {
        process.stderr.write(stdout)
        return process.exit(1)
      }
      try {
        assert(stdout.match(/evalmachine.<anonymous>/) == null)
        assert(stdout.match(path.join(__dirname, path.basename(__filename, '.js') + '.cache.js')) != null)
      } catch (e) {
        process.stderr.write(stdout)
        throw e
      }
    })
    return
  }

  console.log(new Error('foo'))
})()
