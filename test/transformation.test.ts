import { compileWithOptions, MwccConfig } from '../src/index';
import { rimraf } from './util';
import cases from './transformer/cases';
import path = require('path');
import assert = require('assert');
import fs = require('fs');

cases.forEach(esac => {
  describe(`transformation: ${esac.name}`, () => {
    const projectDir = path.resolve(esac.projectRoot);
    const outDir = 'dist';
    const absoluteOutDir = path.resolve(projectDir, outDir);
    beforeEach(() => {
      rimraf(absoluteOutDir);
      process.chdir(projectDir);
    });

    it('should transform', async () => {
      const hintConfig: MwccConfig = {
        compilerOptions: esac?.compilerOptions,
        features: {
          tsc: { transformers: esac.transformers },
        },
      };
      const { diagnostics } = await compileWithOptions(
        projectDir,
        outDir,
        hintConfig
      );
      assert.deepStrictEqual(diagnostics, []);

      esac.assertOutputFiles?.forEach(it => assertOutputFile(it, projectDir));
    });
  });
});

function assertOutputFile(relPath: string, project: string) {
  const actual = readFile(path.join(project, 'dist', relPath));
  const expected = readFile(path.join(project, 'expect', relPath));
  assert.strictEqual(actual, expected);
}

function readFile(path: string) {
  return fs.readFileSync(path, 'utf8').trim().replace(/\r\n/g, '\n');
}
