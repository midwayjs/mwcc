import * as ts from 'typescript'
import * as path from 'path'
import { TsConfigJsonObject, CompilerOptionsJsonObject } from './iface'

export function getDefaultOptions (projectDir: string, outDir: string = 'dist', rootDir: string = 'src'): TsConfigJsonObject {
  const absoluteOutDir = path.resolve(projectDir, outDir)
  const absoluteRootDir = path.resolve(projectDir, rootDir)
  return {
    compilerOptions: {
      // language features
      target: 'es2018',
      module: 'commonjs',
      moduleResolution: 'node',
      jsx: 'react',
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

export function mergeCompilerOptions (base: CompilerOptionsJsonObject, target: CompilerOptionsJsonObject | undefined, projectDir: string) {
  const compilerOptions = Object.assign({}, base, target)
  /**
   * calibrate source root and source map and output dir
   */
  if (target?.rootDir || target?.outDir) {
    const absoluteOutDir = target?.outDir && path.resolve(projectDir, target.outDir) || base.outDir!
    const absoluteRootDir = target?.rootDir && path.resolve(projectDir, target.rootDir) || base.rootDir!
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

export function resolveTsConfigFile (projectDir: string, outDir?: string, configName?: string): ts.ParsedCommandLine {
  let tsconfigPath = ts.findConfigFile(projectDir, ts.sys.fileExists, configName)
  let readConfig
  if (tsconfigPath?.startsWith(projectDir) === false) {
    tsconfigPath = undefined
  }
  if (tsconfigPath != null) {
    if (tsconfigPath == null) {
      throw new Error(`Failed to find a tsconfig.json in directory '${projectDir}'`)
    }
    const readResult = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
    if (readResult.error) {
      throw new Error(`Failed to parse ${tsconfigPath} for ${readResult.error.messageText}`)
    }
    readConfig = readResult.config
  }
  const config = { ...readConfig, compilerOptions: mergeCompilerOptions(getDefaultOptions(projectDir, outDir).compilerOptions!, readConfig?.compilerOptions, projectDir) }
  const cli = ts.parseJsonConfigFileContent(config, ts.sys, projectDir, undefined, tsconfigPath)
  return cli
}
