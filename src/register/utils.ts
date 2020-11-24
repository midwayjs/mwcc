import { basename, extname, resolve } from 'path';
import { existsSync } from 'fs';
export const ignoreFile = filename => {
  const ext = extname(filename);
  return ext !== '.ts' || /(?:^|\/)node_modules\//.test(filename);
};

export const assignMapToCode = (fileName: string, code = '', map = '{}') => {
  const sourceMap = JSON.parse(map);
  sourceMap.file = fileName;
  sourceMap.sources = [fileName];
  delete sourceMap.sourceRoot;
  const sourceMapData = JSON.stringify(sourceMap);
  const base64Map = Buffer.from(sourceMapData, 'utf8').toString('base64');
  const sourceMapContent = `data:application/json;charset=utf-8;base64,${base64Map}`;
  const sourceMapLength =
    `${basename(fileName)}.map`.length + (3 - extname(fileName).length);
  return code.slice(0, -sourceMapLength) + sourceMapContent;
};

export const findRoot = (current: string) => {
  const tsConfig = resolve(current, 'tsconfig.json');
  if (existsSync(tsConfig)) {
    return current;
  }
  throw new Error(`tsconfig.json does not exist in '${current}'`);
};
