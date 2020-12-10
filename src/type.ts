import { TransformerPluginModule } from './transformation/type';

/**
 * e.g. node-v12.0.0
 */
export type CodeCacheVariant = string;

export interface BundlerOptions {
  entries: {
    [name: string]: string | { sourceCode: string; target: string };
  };
  externals?: string[];
  codecache: CodeCacheVariant;
}

export interface CompilerOptionsJsonObject {
  [key: string]: any;
}

export interface TsConfigJsonObject {
  compileOnSave?: boolean;
  compilerOptions?: CompilerOptionsJsonObject;
  include?: string[];
  exclude?: string[];
}

export interface MwccConfig {
  compilerOptions?: CompilerOptionsJsonObject;
  include?: string[];
  exclude?: string[];
  features?: {
    tsc?: boolean | { transformers: TransformerPlugin[] };
    bundler?: BundlerOptions;
  };
}

export interface TransformerPlugin {
  name: string;
  module?: TransformerPluginModule;
}

export interface AnalyzeResult {
  class: {
    [classId: string]: AnalyzeNode;
  };
  decorator: {
    [decoratorName: string]: AnalyzeDecoratorInfo[];
  };
}

export interface AnalyzeDecoratorInfo {
  name: string;
  sourceFile: string;
  params: any[];
  position: AnalyzePositoin;
  target: AnalyzeNode;
  childDecorators?: {
    [decoratorName: string]: AnalyzeDecoratorInfo[];
  };
}

export interface AnalyzeNode {
  type: string;
  name: string;
  position: AnalyzePositoin;
  id: string;
  fileName: string;
  nodeInfo?: {
    extends?: string;
    member: {
      [memberName: string]: AnalyzeNode;
    };
  };
  params?: any[];
  response?: any;
}

export interface AnalyzePositoin {
  range: {
    start: number;
    end: number;
  };
  start: {
    ln: number;
    col: number;
    index: number;
  };
  end: {
    ln: number;
    col: number;
    index: number;
  };
}
