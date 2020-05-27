import * as ts from 'typescript';

import { MwccConfig, MwccContext } from './iface';
import bundler from './feature/bundler';
import createTransformer from './transformer';
import path = require('path');
import assert = require('assert');

export default class Orchestra {
  context: MwccContext;

  private parsedCommandLine: ts.ParsedCommandLine;

  constructor(private projectDir: string, private config?: MwccConfig) {
    const derivedOutputDir = config?.compilerOptions?.outDir ?? 'dist';

    const parsedCommandLine = (this.parsedCommandLine = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      projectDir
    ));

    /**
     * mock paths for bundlers
     */
    const buildDir = path.join(derivedOutputDir, '.mwcc-cache');

    const context: MwccContext = (this.context = {
      config: config!,
      files: parsedCommandLine.fileNames,
      outFiles: [],
      projectDir,
      derivedOutputDir,
      buildDir,
      getTsOutputPath(filename) {
        if (path.isAbsolute(filename) && !filename.startsWith(projectDir)) {
          return;
        }

        const files = ts
          .getOutputFileNames(parsedCommandLine, filename, true)
          .filter(it => it.endsWith('.js'));
        if (files.length === 0) {
          return;
        }
        assert(files.length === 1);
        const expectedOutputFile = files[0];

        const relPath = path.relative(derivedOutputDir, expectedOutputFile);
        const basename = path.basename(relPath);
        return path.join(context.buildDir, path.dirname(relPath), basename);
      },
    });
  }

  async run() {
    const startTime = Date.now();
    const compilerOptions: ts.CompilerOptions = {
      ...this.parsedCommandLine.options,
    };
    /**
     * 0. redirect output dir
     */
    compilerOptions.outDir = this.context.buildDir;

    const host = compilerOptions.incremental
      ? ts.createIncrementalCompilerHost(compilerOptions)
      : ts.createCompilerHost(compilerOptions, true);
    let allDiagnostics: ts.Diagnostic[] = [];
    /**
     * 1. compile TypeScript files
     */
    if (this.config?.features?.tsc) {
      const program = compilerOptions.incremental
        ? ts.createIncrementalProgram({
            rootNames: this.context.files,
            host,
            options: compilerOptions,
          })
        : ts.createProgram(this.context.files, compilerOptions, host);
      const emitResult = program.emit(undefined, undefined, undefined, false, {
        before: [createTransformer(host, this.config)],
      });
      this.context.outFiles = emitResult.emittedFiles ?? [];
      this.calibrateSourceRoots(host);

      allDiagnostics = ts
        .getPreEmitDiagnostics(
          program as ts.Program /** BuilderProgram is sufficient here */
        )
        .concat(emitResult.diagnostics);

      const reporter = this.getDiagnosticReporter();

      ts.sortAndDeduplicateDiagnostics(allDiagnostics).forEach(reporter);
    }

    /**
     * 2. bundler
     */
    if (this.config?.features?.bundler) {
      await bundler(this.context, host);
    }

    /**
     * -1. finalize output files
     */
    this.finalizeFileSystem(host);
    const endTime = Date.now();
    const summary = this.generateBuildSummary(endTime - startTime);
    return { summary, diagnostics: allDiagnostics };
  }

  getDiagnosticReporter(): ts.DiagnosticReporter {
    if ((ts as any).createDiagnosticReporter) {
      return (ts as any).createDiagnosticReporter(ts.sys, true);
    }
    return this.reportDiagnostic;
  }

  reportDiagnostic = (diagnostic: ts.Diagnostic) => {
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start!
      );
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        '\n'
      );
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
      );
    } else {
      console.log(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      );
    }
  };

  finalizeFileSystem(host: ts.CompilerHost) {
    for (const file of this.context.outFiles) {
      const content = host.readFile(file);
      if (content == null) {
        continue;
      }
      const filename = path.resolve(
        this.context.derivedOutputDir,
        path.relative(this.context.buildDir, file)
      );
      host.writeFile(filename, content, false);
    }
    this.context.outFiles = this.context.outFiles.map(it => {
      return path.resolve(
        this.context.derivedOutputDir,
        path.relative(this.context.buildDir, it)
      );
    });
  }

  generateBuildSummary(buildDuration: number) {
    return {
      ...this.config,
      build: {
        duration: buildDuration,
        inputFiles: this.context.files,
        outputFiles: this.context.outFiles,
      },
      versions: {
        mwcc: require('../package.json').version,
        typescript: require(require.resolve('typescript/package.json')).version,
      },
    };
  }

  // Refer to issue https://github.com/microsoft/TypeScript/issues/31873 for more info
  private calibrateSourceRoots(host: ts.CompilerHost) {
    const sourceRoot = this.parsedCommandLine.options.sourceRoot;
    if (sourceRoot == null || !sourceRoot) {
      return;
    }
    this.context.outFiles
      .filter(it => it.endsWith('.map'))
      .forEach(it => {
        const content = host.readFile(it);
        if (content == null) {
          return;
        }
        const json = safeJsonParse(content);
        if (json == null || json.sourceRoot == null) {
          return;
        }
        const calibratedRoot = path.join(
          path.relative(path.dirname(it), this.context.buildDir),
          sourceRoot
        );
        json.sourceRoot = calibratedRoot;
        host.writeFile(it, JSON.stringify(json), false);
      });
  }
}

function safeJsonParse(str: string): any {
  try {
    return JSON.parse(str);
  } catch {
    /** ignore */
  }
}
