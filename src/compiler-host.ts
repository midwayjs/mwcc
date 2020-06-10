import { MwccConfig } from './type';
import ts from 'typescript';
import path from 'path';

export class CompilerHost {
  /** @internal */
  derivedOutputDir: string;
  /** @internal */
  parsedCommandLine: ts.ParsedCommandLine;
  /** @internal */
  compilerHost: ts.CompilerHost;
  /** @internal */
  compilerOptions: ts.CompilerOptions;

  constructor(private projectDir: string, private config: MwccConfig) {
    this.derivedOutputDir = config.compilerOptions?.outDir ?? 'dist';

    this.parsedCommandLine = ts.parseJsonConfigFileContent(
      config, /** not a typo. expects an object has a `compilerOptions` property. */
      ts.sys,
      projectDir
    );

    /**
     * mock paths for bundlers
     */
    const buildDir = path.join(this.derivedOutputDir, '.mwcc-cache');

    const compilerOptions: ts.CompilerOptions = {
      ...this.parsedCommandLine.options,
    };

    /**
     * 0. redirect output dir
     */
    compilerOptions.outDir = buildDir;
    this.compilerOptions = compilerOptions;

    /**
     * 1. compile TypeScript files
     */
    this.compilerHost = compilerOptions.incremental
      ? ts.createIncrementalCompilerHost(compilerOptions)
      : ts.createCompilerHost(compilerOptions, true);
  }

  public getProjectDir(): string {
    return this.projectDir;
  }

  public getMwccConfig(): MwccConfig {
    return this.config;
  }

  public getCompilerOptions(): ts.CompilerOptions {
    return this.compilerOptions;
  }

  public getProjectFiles(): string[] {
    return this.parsedCommandLine.fileNames;
  }
}
