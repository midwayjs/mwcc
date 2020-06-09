import { findAndParseTsConfig } from '../src/index';
import { parseConfiguration } from '../src/comprehension/configuration';
import path = require('path');
import assert = require('assert');
import ts from 'typescript';

describe('comprehension', () => {
  it('should statically evaluate @Configuration', () => {
    const cli = findAndParseTsConfig(
      path.resolve(__dirname, 'comprehension-projects/midwayjs-decorator')
    );
    const host = ts.createCompilerHost(cli.options, true);
    const program = ts.createProgram(cli.fileNames, cli.options, host);
    const result = parseConfiguration(program);
    assert.deepStrictEqual(result, {
      imports: [{ moduleId: 'foo' }, { moduleId: 'bar' }],
      configs: [],
    });
  });

  it('should statically evaluate @Configuration in JavaScript project', () => {
    const cli = findAndParseTsConfig(
      path.resolve(
        __dirname,
        'comprehension-projects/midwayjs-decorator/node_modules/configuration-dep'
      ),
      undefined,
      undefined,
      undefined,
      {
        compilerOptions: {
          allowJs: true,
          experimentalDecorators: true,
        },
        include: ['index.js'],
      }
    );
    const host = ts.createCompilerHost(cli.options, true);
    const program = ts.createProgram(cli.fileNames, cli.options, host);
    const result = parseConfiguration(program);
    assert.deepStrictEqual(result, {
      imports: [{ moduleId: 'foo' }],
      configs: [],
    });
  });
});
