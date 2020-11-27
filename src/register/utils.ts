import { basename, extname } from 'path';

export const ignoreFile = filename => {
  const ext = extname(filename);
  return ext !== '.ts' || /(?:^|\/)node_modules\//.test(filename);
};

export const assignMapToCode = (fileName: string, code = '', map = '{}') => {
  const sourceMap = JSON.parse(map);
  sourceMap.file = fileName;
  sourceMap.sources = [fileName];
  delete sourceMap.sourceRoot;
  // Reference from https://github.com/TypeStrong/ts-node/blob/a7aa0af9aefae1a7d801bbfe969148866c852a5c/src/index.ts#L1172
  const sourceMapData = JSON.stringify(sourceMap);
  const base64Map = Buffer.from(sourceMapData, 'utf8').toString('base64');
  const sourceMapContent = `data:application/json;charset=utf-8;base64,${base64Map}`;
  const sourceMapLength =
    `${basename(fileName)}.map`.length + (3 - extname(fileName).length);
  return code.slice(0, -sourceMapLength) + sourceMapContent;
};
