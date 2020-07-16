import tsquery from './tsquery/query';

export * from './orchestra';
export { CompilerHost } from './compiler-host';
export { Program } from './program';
export { getDefaultConfig, resolveTsConfigFile, mergeConfigs } from './config';
export * from './type';
export * from './transformation/type';
export { template } from './template';
export { Analysis } from './comprehension/analysis';
export { getCodeOfNode } from './util';
export { tsquery };
