import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'
import Orchestra from './orchestra'
import { MwccConfig } from './iface'
import { getDefaultConfig, resolveTsConfigFile, mergeConfigs } from './config'

async function compile (projectDir: string, config: MwccConfig) {
  const orchestration = new Orchestra(projectDir, config)
  const { summary, diagnostics } = await orchestration.run()

  fs.writeFileSync(path.join(orchestration.context.derivedOutputDir, 'midway.build.json'), JSON.stringify(summary, null, 2))
  return { summary, diagnostics }
}

export async function compileWithOptions (projectDir: string, outDir: string, hintConfig?: MwccConfig) {
  projectDir = path.resolve(projectDir)
  const defaultConfig = getDefaultConfig(projectDir, outDir)
  const config = mergeConfigs(defaultConfig, hintConfig, projectDir)

  return compile(projectDir, config)
}

export async function compileInProject (projectDir: string, outDir: string, hintConfig?: MwccConfig, overrideConfig?: MwccConfig) {
  const { config } = resolveTsConfigFile(projectDir, outDir, undefined, hintConfig, overrideConfig)
  return compile(projectDir, config)
}

export const findAndParseTsConfig = function findAndParseTsConfig (projectDir: string, outDir?: string, configName?: string, hintConfig?: MwccConfig, overrideConfig?: MwccConfig) {
  const { config, tsconfigPath } = resolveTsConfigFile(projectDir, outDir, configName, hintConfig, overrideConfig)
  const cli = ts.parseJsonConfigFileContent(config, ts.sys, projectDir, undefined, tsconfigPath)
  return cli
}
