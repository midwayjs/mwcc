import { CompilerHost } from './compiler-host';
import ts from 'typescript';
import createTransformer from './transformation/transformer';
import { safeJsonParse, assert, debug } from './util';
import path from 'path';
import bundler from './feature/bundler';
import { MwccConfig } from './type';

export interface MwccContext {
  config: MwccConfig;
  files: string[];
  outFiles: string[];
  projectDir: string;
  buildDir: string;
  derivedOutputDir: string;
  getTsOutputPath: (filename: string) => string | undefined;
}

export class Program {
  /** @internal */
  context: MwccContext;
  /** @internal */
  program: ts.Program;
  /** @internal */
  builderProgram: ts.BuilderProgram | undefined;

  constructor(private host: CompilerHost, files?: string[]) {
    const compilerOptions = host.getCompilerOptions();
    const projectDir = host.getProjectDir();
    const parsedCommandLine = host.parsedCommandLine;
    const derivedOutputDir = host.derivedOutputDir;
    files = files ?? host.getProjectFiles();

    const context: MwccContext = (this.context = {
      config: this.host.getMwccConfig(),
      files,
      outFiles: [],
      projectDir,
      derivedOutputDir,
      buildDir: host.compilerOptions.outDir!,
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

    if (compilerOptions.incremental) {
      this.builderProgram = ts.createIncrementalProgram({
        rootNames: files,
        host: host.compilerHost,
        options: compilerOptions,
      });
      this.program = this.builderProgram.getProgram();
    } else {
      this.program = ts.createProgram(
        files,
        compilerOptions,
        host.compilerHost
      );
    }
  }

  getTypeChecker(): ts.TypeChecker {
    return this.program.getTypeChecker();
  }

  getSourceFiles(): readonly ts.SourceFile[] {
    return this.program.getSourceFiles();
  }

  getSourceFile(filename: string): ts.SourceFile | undefined {
    return this.program.getSourceFile(filename);
  }

  async emit() {
    let allDiagnostics: ts.Diagnostic[] = [];

    const emitResult = this.program.emit(
      undefined,
      undefined,
      undefined,
      false,
      {
        before: [
          createTransformer(
            this.host.compilerHost,
            this.getTypeChecker(),
            this.host.getMwccConfig()
          ),
        ],
      }
    );
    this.context.outFiles = emitResult.emittedFiles ?? [];
    this.calibrateSourceRoots(this.host.compilerHost);

    allDiagnostics = ts
      .getPreEmitDiagnostics(this.program)
      .concat(emitResult.diagnostics);

    const reporter = this.getDiagnosticReporter();

    ts.sortAndDeduplicateDiagnostics(allDiagnostics).forEach(reporter);

    /**
     * 2. bundler
     */
    if (this.context.config?.features?.bundler) {
      await bundler(this.context, this.host.compilerHost);
    }

    /**
     * -1. finalize output files
     */
    this.finalizeFileSystem(this.host.compilerHost);
    const summary = this.generateBuildSummary();

    ts.sys.writeFile(
      path.join(this.context.derivedOutputDir, 'midway.build.json'),
      JSON.stringify(summary, null, 2)
    );

    return { summary, diagnostics: allDiagnostics };
  }

  emitFile(
    fileName: string
  ): { code: string; map: string; declaration: string } {
    const output = { code: '', map: '', declaration: '' };
    if (!path.isAbsolute(fileName)) {
      fileName = path.join(this.context.projectDir, fileName);
    }
    const sourceFile = this.program.getSourceFile(fileName);
    if (sourceFile == null) {
      throw new Error(`file not found in project: ${fileName}`);
    }
    this.program.emit(
      sourceFile,
      (path, file) => {
        if (path.endsWith('.map')) {
          output.map = file;
        } else if (path.endsWith('.d.ts')) {
          output.declaration = file;
        } else {
          output.code = file;
        }
      },
      undefined,
      false,
      {
        before: [
          createTransformer(
            this.host.compilerHost,
            this.getTypeChecker(),
            this.host.getMwccConfig()
          ),
        ],
      }
    );
    return output;
  }

  /** @internal */
  getDiagnosticReporter(): ts.DiagnosticReporter {
    if ((ts as any).createDiagnosticReporter) {
      return (ts as any).createDiagnosticReporter(ts.sys, true);
    }
    return this.reportDiagnostic;
  }

  /** @internal */
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

  /** @internal */
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

  /** @internal */
  generateBuildSummary() {
    return {
      ...this.context.config,
      build: {
        inputFiles: this.context.files,
        outputFiles: this.context.outFiles,
      },
      versions: {
        mwcc: require('../package.json').version,
        typescript: require(require.resolve('typescript/package.json')).version,
      },
    };
  }

  /**
   * @internal
   * Refer to issue https://github.com/microsoft/TypeScript/issues/31873 for more info
   */
  calibrateSourceRoots(host: ts.CompilerHost) {
    const sourceRoot = this.host.parsedCommandLine.options.sourceRoot;
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
