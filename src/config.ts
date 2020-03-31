import * as ts from 'typescript'
import * as path from 'path'
import { MwccOptions } from './iface'

export function getDefaultOptions (projectDir: string, outputDir: string = 'dist', rootDir: string = 'src'): MwccOptions {
  return {
    compilerOptions: {
      target: ts.ScriptTarget.ES2018,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      jsx: ts.JsxEmit.React,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      sourceMap: true,
      inlineSourceMap: false,
      inlineSources: false,
      outDir: path.resolve(projectDir, outputDir),
      rootDir: path.resolve(projectDir, rootDir),
      listEmittedFiles: true
    },
    exclude: ['**/node_modules']
  }
}

export function mergeCompilerOptions (base: ts.CompilerOptions, target?: ts.CompilerOptions) {
  const compilerOptions = Object.assign({}, base, target)
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
  const config = { ...readResult.config, compilerOptions: mergeCompilerOptions(getDefaultOptions(projectDir).compilerOptions!, readResult.config.compilerOptions) }
  const cli = ts.parseJsonConfigFileContent(config, ts.sys, projectDir, undefined, tsconfigPath)
  return cli
}
