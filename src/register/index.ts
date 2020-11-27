import { ignoreFile, assignMapToCode, debug } from './utils';
import { CompilerHost } from '../compiler-host';
import { Program } from '../program';
import { resolveTsConfigFile } from '../config';
import { existsSync } from 'fs';
import { resolve } from 'path';

function register() {
  const old =
    require.extensions['.ts'] || require.extensions['.js'] || (() => {}); // eslint-disable-line
  const program = createProgram();
  const getCompiledCodeAndMap = fileName => {
    return program.emitFile(fileName);
  };
  //  eslint-disable-next-line
  require.extensions['.ts'] = (m: any, filename: string) => {
    if (ignoreFile(filename)) {
      return old(m, filename);
    }

    const _compile = m._compile;
    m._compile = function (_: string, fileName: string) {
      const codeAndMap = getCompiledCodeAndMap(fileName);
      debug('codeAndMap', codeAndMap, fileName);
      return _compile.call(
        this,
        assignMapToCode(fileName, codeAndMap.code, codeAndMap.map),
        fileName
      );
    };
    return old(m, filename);
  };
}

const createProgram = () => {
  const cwd = process.cwd();
  if (!existsSync(resolve(cwd, 'tsconfig.json'))) {
    throw new Error(`tsconfig.json does not exist in '${cwd}'`);
  }
  debug('cwd', cwd);
  const { config } = resolveTsConfigFile(cwd, undefined, undefined, undefined, {
    compilerOptions: {
      sourceMap: true,
      inlineSourceMap: false,
      inlineSources: true,
      outDir: '.mwts-node',
      declaration: false,
    },
  });
  debug('config', config);
  const compilerHost = new CompilerHost(cwd, config);
  const program = new Program(compilerHost);
  return program;
};

register();
