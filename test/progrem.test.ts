import { resolveTsConfigFile, CompilerHost, Program } from '../src';
import { join } from 'path';
import assert from 'assert';
describe('program', () => {
  it('emitFile', async () => {
    const cwd = join(__dirname, './cases/projects/bundle');
    const { config } = resolveTsConfigFile(
      cwd,
      undefined,
      undefined,
      undefined,
      {
        compilerOptions: {
          sourceMap: true,
          inlineSourceMap: false,
          declaration: true,
        },
      }
    );
    const compilerHost = new CompilerHost(cwd, config);
    const program = new Program(compilerHost);
    const result = program.emitFile('src/entry.ts');
    assert(result.code.indexOf('function foo(it)') !== -1);
    assert(result.map.indexOf('"sources":["entry.ts"]') !== -1);
    assert(result.declaration.indexOf('export interface IFoo') !== -1);
  });
});
