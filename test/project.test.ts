import * as fs from 'fs'
import * as path from 'path'
import * as globby from 'globby'
import * as childProcess from 'child_process'

import { compileWithOptions, compileInProject } from '../src/index'
import { rimraf } from './util'
import assert = require('assert')

const projectCases = fs.readdirSync(path.join(__dirname, 'cases/project'))

for (const projectName of projectCases) {
  const project = loadProject(projectName)
  describe(`project: ${projectName}`, () => {
    const projectDir = path.resolve(project.projectRoot)
    const outDir = path.resolve(project.projectRoot, project.outDir || 'dist')

    describe('compile', () => {
      beforeEach(() => {
        rimraf(outDir)
        process.chdir(projectDir)
      })

      it('should compile', async () => {
        const { diagnostics } = await compileWithOptions(projectDir, outDir, { compilerOptions: project.compilerOptions, plugins: project.plugins, include: project.include, exclude: project.exclude })

        assert.deepStrictEqual(diagnostics, [])

        const actualFiles: string[] = globby.sync('**/*', {
          dot: true,
          cwd: outDir
        }).map(it => path.relative(projectDir, path.resolve(outDir, it)))
        actualFiles.sort()
        const configJsonIdx = actualFiles.findIndex(it => path.basename(it) === 'midway.build.json')
        assert(configJsonIdx > 0, 'expect midway.build.json')
        actualFiles.splice(configJsonIdx, 1)

        project.outputFiles.sort()
        assert.deepStrictEqual(actualFiles, project.outputFiles)

        const midwayBuildJson = JSON.parse(fs.readFileSync(path.resolve(outDir, 'midway.build.json'), 'utf8'))
        assert(midwayBuildJson.compilerOptions != null)
        assert(midwayBuildJson.compilerOptions.module === 'commonjs')
        assert(midwayBuildJson.compilerOptions.jsx === 'react')
      })

      it('should compile in project', async () => {
        const { diagnostics } = await compileInProject(projectDir, outDir, { compilerOptions: project.compilerOptions, plugins: project.plugins, include: project.include, exclude: project.exclude })

        assert.deepStrictEqual(diagnostics, [])

        const actualFiles: string[] = globby.sync('**/*', {
          dot: true,
          cwd: outDir
        }).map(it => path.relative(projectDir, path.resolve(outDir, it)))
        actualFiles.sort()
        const configJsonIdx = actualFiles.findIndex(it => path.basename(it) === 'midway.build.json')
        assert(configJsonIdx > 0, 'expect midway.build.json')
        actualFiles.splice(configJsonIdx, 1)

        project.outputFiles.sort()
        assert.deepStrictEqual(actualFiles, project.outputFiles)
      })
    })

    describe('integration', () => {
      if (project.sourceMapFiles) {
        it('source map files validation', async () => {
          const sourceMaps = project.outputFiles.filter(it => it.endsWith('.map'))
            .map(it => [it, fs.readFileSync(path.resolve(projectDir, it))])
            .map(([path, content]) => [path, JSON.parse(content)])
          for (const [filePath, sourceMap] of sourceMaps) {
            const expectedMappings = project.sourceMapFiles[filePath]
            if (!expectedMappings) {
              continue
            }
            for (const item of expectedMappings) {
              assert.ok(sourceMap.sources.indexOf(item) >= 0)
            }
          }
        })
      }

      if (project.integration) {
        it('integration', async () => {
          await exec(path.resolve(projectDir, project.integration))
        })
      }
    })
  })
}

function loadProject (projectName: string) {
  const filepath = path.join(__dirname, 'cases/project', projectName)
  let it
  try {
    it = JSON.parse(fs.readFileSync(filepath, 'utf8'))
  } catch (e) {
    throw new Error(`Invalid project definition file(${filepath}).`)
  }
  return it
}

async function exec (file: string) {
  if (!fs.statSync(file).isFile()) {
    throw new Error(`${file} not exists`)
  }
  return new Promise((resolve, reject) => {
    const cp = childProcess.spawn(process.execPath, [file], { stdio: 'inherit' })
    cp.on('error', (err) => {
      reject(err)
    })
    cp.on('exit', (code) => {
      if (code !== 0) {
        return reject(new Error(`Execute ${file} failed for non-zero code`))
      }
      resolve()
    })
  })
}
