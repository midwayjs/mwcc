import * as ts from 'typescript'
import * as path from 'path'
import { MwccOptions } from './iface'

export function getDefaultOptions (projectDir: string, outputDir: string = 'dist', rootDir: string = 'src'): MwccOptions {
  const absoluteOutDir = path.resolve(projectDir, outputDir)
  const absoluteRootDir = path.resolve(projectDir, rootDir)
  return {
    compilerOptions: {
      // language features
      target: ts.ScriptTarget.ES2018,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      jsx: ts.JsxEmit.React,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      // source maps
      sourceMap: true,
      inlineSourceMap: false,
      inlineSources: false,
      // directories
      sourceRoot: path.relative(absoluteOutDir, absoluteRootDir),
      outDir: absoluteOutDir,
      rootDir: absoluteRootDir,
      // program emit options
      listEmittedFiles: true
    },
    exclude: ['**/node_modules']
  }
}

export function mergeCompilerOptions (base: ts.CompilerOptions, target: ts.CompilerOptions | undefined, projectDir: string) {
  const compilerOptions = Object.assign({}, base, target)
  /**
   * calibrate source root and source map and output dir
   */
  if (target?.rootDir || target?.outDir) {
    const absoluteOutDir = target?.outDir && path.resolve(target.outDir) || base.outDir!
    const absoluteRootDir = target?.rootDir && path.resolve(target.rootDir) || base.rootDir!
    compilerOptions.sourceRoot = path.relative(absoluteOutDir, absoluteRootDir)
    compilerOptions.outDir = absoluteOutDir
    compilerOptions.rootDir = absoluteRootDir
  }

  if (target?.inlineSourceMap) {
    delete compilerOptions.sourceMap
  }
  if (target?.out || target?.outFile) {
    delete compilerOptions.out
    delete compilerOptions.outFile
    // TODO: diagnostics warnings.
  }
  if (compilerOptions.incremental && compilerOptions.tsBuildInfoFile == null) {
    compilerOptions.tsBuildInfoFile = path.join(compilerOptions.outDir!, '.tsbuildinfo')
  }
  return compilerOptions
}

export function resolveTsConfigFile (projectDir: string, configName?: string): ts.ParsedCommandLine {
  const tsconfigPath = ts.findConfigFile(projectDir, ts.sys.fileExists, configName)
  if (tsconfigPath == null) {
    throw new Error(`Failed to find a tsconfig.json in directory '${projectDir}'`)
  }
  const readResult = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
  if (readResult.error) {
    throw new Error(`Failed to parse ${tsconfigPath} for ${readResult.error.messageText}`)
  }
  const config = { ...readResult.config, compilerOptions: mergeCompilerOptions(getDefaultOptions(projectDir).compilerOptions!, readResult.config.compilerOptions, projectDir) }
  const cli = ts.parseJsonConfigFileContent(config, ts.sys, projectDir, undefined, tsconfigPath)
  return cli
}
