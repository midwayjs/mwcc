import * as ts from 'typescript'

import { MwccOptions, MwccContext } from './iface'
import bundler from './plugin/bundler'
import fs = require('fs');
import path = require('path');
import os = require('os');
import assert = require('assert');

export default class Orchestra {
  context: MwccContext;

  private parsedCommandLine: ts.ParsedCommandLine;

  constructor (private projectDir: string, private options?: MwccOptions) {
    const derivedRootDir = options?.compilerOptions?.rootDir ?? 'src'
    const derivedOutputDir = options?.compilerOptions?.outDir ?? 'dist'

    const parsedCommandLine = this.parsedCommandLine = ts.parseJsonConfigFileContent(options, ts.sys, projectDir)

    const context: MwccContext = this.context = {
      options: options!,
      files: parsedCommandLine.fileNames,
      outFiles: [],
      projectDir,
      derivedOutputDir,
      buildDir: fs.mkdtempSync(path.join(os.tmpdir(), 'mwcc-')),
      getTsOutputPath (filename) {
        if (path.isAbsolute(filename) && !filename.startsWith(projectDir)) {
          return
        }

        const files = ts.getOutputFileNames(parsedCommandLine, filename, true)
          .filter(it => it.endsWith('.js'))
        if (files.length === 0) {
          return
        }
        assert(files.length === 1)
        const expectedOutputFile = files[0]

        const relPath = path.relative(derivedOutputDir, expectedOutputFile)
        const basename = path.basename(relPath)
        return path.join(context.buildDir, path.dirname(relPath), basename)
      }
    }
  }

  async run () {
    const compilerOptions: ts.CompilerOptions = { ...this.context.options.compilerOptions }
    /**
     * 0. redirect output dir
     */
    compilerOptions.outDir = this.context.buildDir
    /**
     * 1. compile TypeScript files
     */
    const host = ts.createCompilerHost(compilerOptions)
    const program = ts.createProgram(this.context.files, compilerOptions, host)
    const emitResult = program.emit()
    this.context.outFiles = emitResult.emittedFiles ?? []

    const allDiagnostics = ts
      .getPreEmitDiagnostics(program)
      .concat(emitResult.diagnostics)

    const reporter = this.getDiagnosticReporter()

    ts.sortAndDeduplicateDiagnostics(allDiagnostics)
      .forEach(reporter)

    /**
     * 2. run plugins
     */
    if (this.options?.plugins?.bundler) {
      await bundler(this.context, host)
    }

    /**
     * -1. finalize output files
     */
    this.finalizeFileSystem(host)
    const summary = this.generateBuildSummary()
    return { summary, diagnostics: allDiagnostics }
  }

  getDiagnosticReporter (): ts.DiagnosticReporter {
    if ((ts as any).createDiagnosticReporter) {
      return (ts as any).createDiagnosticReporter(ts.sys, true)
    }
    return this.reportDiagnostic
  }

  reportDiagnostic = (diagnostic: ts.Diagnostic) => {
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!)
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`)
    } else {
      console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    }
  }

  finalizeFileSystem (host: ts.CompilerHost) {
    for (const file of this.context.outFiles) {
      const content = host.readFile(file)
      if (content == null) {
        continue
      }
      const filename = path.resolve(this.context.derivedOutputDir, path.relative(this.context.buildDir, file))
      host.writeFile(filename, content, false)
    }
    this.context.outFiles = this.context.outFiles.map(it => {
      return path.resolve(this.context.derivedOutputDir, path.relative(this.context.buildDir, it))
    })
  }

  generateBuildSummary () {
    return {
      ...this.context.options,
      build: {
        inputFiles: this.context.files,
        outputFiles: this.context.outFiles
      },
      versions: {
        mwcc: require('../package.json').version,
        typescript: require(require.resolve('typescript/package.json')).version
      }
    }
  }
}