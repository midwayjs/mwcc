import * as ts from 'typescript'

export type CodeCacheVariant = 'node-v12' | 'node-v10';

export interface BundlerOptions {
  entries: {
    [name: string]: string
  };
  codecache: CodeCacheVariant;
}

export interface CompilerOptionsJsonObject {
  [key: string]: any
}

export interface TsConfigJsonObject {
  compileOnSave?: boolean;
  compilerOptions?: CompilerOptionsJsonObject;
  include?: string[];
  exclude?: string[];
}

export interface MwccConfig {
  compilerOptions?: ts.CompilerOptions;
  include?: string[];
  exclude?: string[];
  plugins?: {
    bundler?: BundlerOptions,
  };
}

export interface MwccBuildSummary extends MwccConfig {
  build: {
    files: string[],
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

export interface MwccCompilerHost extends ts.CompilerHost {

}
