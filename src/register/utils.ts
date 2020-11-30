import { extname } from 'path';

export const ignoreFile = filename => {
  const ext = extname(filename);
  return ext !== '.ts' || /(?:^|\/)node_modules\//.test(filename);
};
