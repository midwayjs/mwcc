import { ignoreFile, assignMapToCode, findRoot, debug } from './utils';
import { CompilerHost } from '../compiler-host';
import { Program } from '../program';
import { resolveTsConfigFile } from '../config';
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
    m._compile = function (code: string, fileName: string) {
      const codeAndMap = getCompiledCodeAndMap(fileName);
      debug('codeAndMap', codeAndMap, fileName);
      return _compile.call(
        this,
        assignMapToCode(fileName, codeAndMap[0], codeAndMap[1]),
        fileName
      );
    };
    return old(m, filename);
  };
}

const createProgram = () => {
  const cwd = findRoot(process.cwd());
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
