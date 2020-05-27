import * as ts from 'typescript';

export { TransformationContext } from './transformation/transformation-context';

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
    tsc?: boolean | { transformers: { name: string }[] };
    bundler?: BundlerOptions;
  };
}

export interface MwccBuildSummary extends MwccConfig {
  build: {
    files: string[];
  };
}

export interface MwccContext {
  config: MwccConfig;
  files: string[];
  outFiles: string[];
  projectDir: string;
  buildDir: string;
  derivedOutputDir: string;
  getTsOutputPath: (filename: string) => string | undefined;
}

export type MwccCompilerHost = ts.CompilerHost;
