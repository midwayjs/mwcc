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
    tsc?:
      | boolean
      | { transformers: { name: string; module?: TransformerPluginModule }[] };
    bundler?: BundlerOptions;
  };
}

export interface AnalyzeResult {
  decorator: {
    [decoratorName: string]: AnalyzeDecoratorInfo[];
  };
}

export interface AnalyzeDecoratorInfo {
  name: string;
  sourceFile: string;
  params: any[];
  position: AnalyzePositoin;
  target: {
    type: string;
    name: string;
    position: AnalyzePositoin;
    params?: any[];
    response?: any;
  };
  childDecorators?: {
    [decoratorName: string]: AnalyzeDecoratorInfo[];
  };
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
