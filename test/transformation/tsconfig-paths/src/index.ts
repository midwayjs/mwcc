import util from '@/util';
import foo from '@/foo';
import bar from '@/util/bar';
import '@/log';
import str = require('@/util/string');
export { OnlyType } from '@/export/type';
export { func } from '@/export/func';
export { func as demoFunc } from '@/export/func';

export type ImportType = import('@/export/type').OnlyType;

console.log(foo, bar, util, str);

async function dynamic() {
  const loader = await import('@async/loader');
  const strUtil = require('@/util/string');
  console.log(loader, strUtil);
}
