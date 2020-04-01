import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'
import Orchestra from './orchestra'
import { MwccConfig } from './iface'
import { mergeCompilerOptions, getDefaultConfig, resolveTsConfigFile, mergeConfigs } from './config'
import { extend } from './util'

export async function compileWithOptions (projectDir: string, outDir: string, hintConfig?: MwccConfig) {
  projectDir = path.resolve(projectDir)
  const defaultConfig = getDefaultConfig(projectDir, outDir)
  const config =  mergeConfigs(defaultConfig, hintConfig, projectDir)

  const orchestration = new Orchestra(projectDir, config)
  const { summary, diagnostics } = await orchestration.run()

  fs.writeFileSync(path.join(orchestration.context.derivedOutputDir, 'midway.build.json'), JSON.stringify(summary, null, 2))
  return { summary, diagnostics }
}

export async function compileInProject (projectDir: string, outDir: string, options?: MwccConfig) {
  const cli = resolveTsConfigFile(projectDir, outDir, undefined, options)
  return compileWithOptions(projectDir, outDir, extend(options, { compilerOptions: cli.options, exclude: cli.raw.exclude, include: cli.raw.include }))
}

export const findAndParseTsConfig = resolveTsConfigFile
