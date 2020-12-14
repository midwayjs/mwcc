import * as ts from 'typescript';
import tsquery from './tsquery/query';

export { tsquery, ts };

export * from './orchestra';
export { CompilerHost } from './compiler-host';
export { Program } from './program';
export { getDefaultConfig, resolveTsConfigFile, mergeConfigs } from './config';
export * from './type';
export * from './transformation/type';
export { template } from './template';
export { Analyzer } from './comprehension/analyze';
export { getCodeOfNode } from './util';
