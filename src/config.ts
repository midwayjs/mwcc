import * as ts from 'typescript'
import * as path from 'path'
import { TsConfigJsonObject, CompilerOptionsJsonObject, MwccConfig } from './iface'
import { extend } from './util'

export function getDefaultConfig (projectDir: string, outDir: string = 'dist', sourceDir: string = 'src'): TsConfigJsonObject {
  const absoluteRootDir = path.resolve(projectDir)
  const absoluteOutDir = path.resolve(absoluteRootDir, outDir)
  const absoluteSourceDir = path.resolve(absoluteRootDir, sourceDir)
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
      sourceRoot: path.relative(absoluteOutDir, absoluteSourceDir),
      // directories
      outDir: absoluteOutDir,
      rootDir: absoluteSourceDir, // flatten out dir (i.e. out/src/index.js -> out/index.js)
      // program emit options
      listEmittedFiles: true
    },
    include: [absoluteSourceDir],
    exclude: ['**/node_modules']
  }
}

export function mergeCompilerOptions (base: CompilerOptionsJsonObject, target: CompilerOptionsJsonObject | undefined, projectDir: string): CompilerOptionsJsonObject {
  const compilerOptions = extend(base, target)
  /**
   * calibrate source root and source map and output dir
   */
  if (target?.rootDir || target?.outDir) {
    const absoluteOutDir = target?.outDir ? path.resolve(projectDir, target.outDir) : base.outDir!
    const absoluteRootDir = target?.rootDir ? path.resolve(projectDir, target.rootDir) : base.rootDir!
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

export function mergeConfigs (base: MwccConfig, target: MwccConfig | undefined, projectDir: string): MwccConfig {
  const compilerOptions = mergeCompilerOptions(base.compilerOptions!, target?.compilerOptions, projectDir)
  let include = new Set(base.include!)
  if (target?.include) {
    include = new Set([...target.include])
  }
  if (target?.compilerOptions?.rootDir && target?.compilerOptions.rootDir !== base.compilerOptions?.rootDir) {
    include.delete(base.compilerOptions?.rootDir!)
    include.add(compilerOptions.rootDir)
  }

  return extend(base, target, { compilerOptions, include: [...include] })
}

export function resolveTsConfigFile (projectDir: string, outDir?: string, configName?: string, hintConfig?: MwccConfig) {
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
  const defaultConfig = getDefaultConfig(projectDir, outDir)
  let config = mergeConfigs(defaultConfig, hintConfig, projectDir)
  config = mergeConfigs(config, readConfig, projectDir)
  return { config, tsconfigPath }
}
