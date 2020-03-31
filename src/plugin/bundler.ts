import * as path from 'path'
import * as childProcess from 'child_process'
import { MwccContext, MwccCompilerHost } from '../iface'
import ncc = require('@midwayjs/ncc')

export default async function bundle (ctx: MwccContext, host: MwccCompilerHost) {
  const bundleOpts = ctx.options.plugins!.bundler!
  let outFiles: string[] = []

  for (let [entry, target] of Object.entries(bundleOpts.entries)) {
    entry = path.resolve(ctx.projectDir, entry)
    if (ctx.files.indexOf(entry) < 0) {
      throw new Error(`entry(${entry}) not included in compilation.`)
    }
    const resolvedEntry = ctx.getTsOutputPath(entry)
    const targetFilePath = path.resolve(ctx.buildDir, target)
    const { code, map } = await ncc(resolvedEntry, {
      cache: false,
      filename: target,
      sourceMap: true,
      sourceMapRegister: false,
      quiet: true
    })

    if (bundleOpts.codecache) {
      const files = await codecache(host, targetFilePath, code)
      outFiles = outFiles.concat(files)
    } else {
      host.writeFile(targetFilePath, code, false)
      outFiles.push(targetFilePath)
    }

    host.writeFile(`${targetFilePath}.map`, map, false)
    outFiles.push(`${targetFilePath}.map`)
  }

  ctx.outFiles = outFiles
}

async function codecache (host: MwccCompilerHost, targetFilepath: string, code: string) {
  const basename = path.basename(targetFilepath, '.js')
  const cachedDataFilePath = path.join(path.dirname(targetFilepath), basename + '.cache')
  const cachedCodeFilePath = path.join(path.dirname(targetFilepath), basename + '.cache.js')

  const columnOffset = -'(function (exports, require, module, __filename, __dirname) { '.length
  const cachedEntry =
    `const { readFileSync, writeFileSync } = require('fs'), { Script } = require('vm'), { wrap } = require('module');
     const source = readFileSync(__dirname + '/${basename}.cache.js', 'utf-8');
     const cachedData = !process.pkg && require('process').platform !== 'win32' && readFileSync(__dirname + '/${basename}.cache');
     const scriptOpts = { filename: '${basename}.cache.js', columnOffset: ${columnOffset} }
     const script = new Script(wrap(source), cachedData ? Object.assign({ cachedData }, scriptOpts) : scriptOpts);
     (script.runInThisContext())(exports, require, module, __filename, __dirname);\n`
  host.writeFile(cachedCodeFilePath, code, false)
  host.writeFile(targetFilepath, cachedEntry, false)

  const execPath = await resolveNodeBinary('node-' + process.version)
  if (execPath == null) {
    throw new Error(`Unable to resolve Node.js binary for ${'node-' + process.version}`)
  }
  await spawn(execPath, [path.resolve(__dirname, '../../bin/codecache.js'), cachedCodeFilePath, cachedDataFilePath])

  return [cachedDataFilePath, cachedCodeFilePath, targetFilepath]
}

function resolveNodeBinary (variant: string) {
  // TODO: resolve node binary with online service?
  const match = variant.match(/((?:ali)?node)-v(\d+\.\d+\.\d+(?:-\.+)?)/)
  if (match == null) {
    return null
  }
  if (match[2] !== process.versions[match[1] as keyof typeof process.versions]) {
    return null
  }
  return process.execPath
}

function spawn (command: string, args: string[]) {
  return new Promise((resolve, reject) => {
    const cp = childProcess.spawn(command, args, { stdio: 'inherit' })
    cp.on('error', (err) => {
      reject(err)
    })
    cp.on('exit', (code: number) => {
      if (code > 0) {
        return reject(new Error(`command(${command}) exited with non-zero code.`))
      }
      resolve()
    })
  })
}
