import { compileWithOptions } from '../src/index'
import { rimraf } from './util'
import path = require('path')
import assert = require('assert')
import fs = require('fs')

describe('transformation', () => {
  const projectDir = path.resolve(__dirname, './transformation/function-call')
  const outDir = 'dist'
  const absoluteOutDir = path.resolve(projectDir, outDir)
  beforeEach(() => {
    rimraf(absoluteOutDir)
    process.chdir(projectDir)
  })
  it('should transform', async () => {
    const { diagnostics } = await compileWithOptions(projectDir, outDir, {
      features: {
        tsc: {
          transformers: [
            {
              name: require.resolve('./transformer/use-bind.ts')
            }
          ]
        }
      }
    })
    assert.deepStrictEqual(diagnostics, [])

    assertOutputFile('index.js', projectDir)
  })
})

function assertOutputFile (relPath: string, project: string) {
  const actual = fs.readFileSync(path.join(project, 'dist', relPath), 'utf8').trim()
  const expected = fs.readFileSync(path.join(project, 'expect', relPath), 'utf8').trim()
  assert.strictEqual(actual, expected)
}
