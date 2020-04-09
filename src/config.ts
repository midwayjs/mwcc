import * as ts from 'typescript'
import * as path from 'path'
import { CompilerOptionsJsonObject, MwccConfig } from './iface'
import { extend } from './util'
import * as logger from './logger'

export function getDefaultConfig (projectDir: string, outDir: string = 'dist', sourceDir: string = 'src'): MwccConfig {
  const absoluteRootDir = path.resolve(projectDir)
  const absoluteOutDir = path.resolve(absoluteRootDir, outDir)
  const absoluteSourceDir = path.resolve(absoluteRootDir, sourceDir)
  return {
    features: {
      tsc: true
    },
    compilerOptions: {
      // language features
      target: 'es2018',
      module: 'commonjs',
      moduleResolution: 'node',
      jsx: 'react',
      allowJs: true,
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
    compilerOptions.outDir = absoluteOutDir
    compilerOptions.rootDir = absoluteRootDir
    if (target?.compilerOptions?.sourceRoot == null) {
      compilerOptions.sourceRoot = path.relative(absoluteOutDir, absoluteRootDir)
    }
  }

  if (target?.inlineSourceMap) {
    delete compilerOptions.sourceMap
  }
  ;[
    'out',
    'outFile',
    'rootDirs',
    ['module', 'commonjs'],
    ['importHelpers', false],
    ['emitBOM', false],
    ['listEmittedFiles', true],
    ['experimentalDecorators', true],
    ['emitDecoratorMetadata', true],
  ].forEach(key => {
    if (Array.isArray(key)) {
      overrideCompilerOptions(target, compilerOptions, key[0] as string, key[1])
    } else {
      overrideCompilerOptions(target, compilerOptions, key)
    }
  })
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

  const features = extend(base.features, target?.features)

  return extend(base, target, { compilerOptions, include: [...include], features })
}

export function resolveTsConfigFile (projectDir: string, outDir?: string, configName?: string, hintConfig?: MwccConfig, overrideConfig?: MwccConfig) {
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
  config = mergeConfigs(config, { compilerOptions: { outDir } }, projectDir)
  config = mergeConfigs(config, overrideConfig, projectDir)
  return { config, tsconfigPath }
}

function overrideCompilerOptions (target: CompilerOptionsJsonObject | undefined, compilerOptions: CompilerOptionsJsonObject, key: string, val?: any) {
  if (target?.[key] == null) {
    return
  }
  if (typeof target[key] !== 'string' && target[key] === val) {
    return
  }
  if (typeof target[key] === 'string' && target[key].toLowerCase() === val) {
    return
  }
  logger.warning(`override compilerOptions.out with '${val}'`)
  if (val == null) {
    delete compilerOptions[key]
  } else {
    compilerOptions[key] = val
  }
}
