import * as fs from 'fs'
import * as path from 'path'
import Orchestra from './orchestra'
import { MwccOptions } from './iface'
import { mergeCompilerOptions, getDefaultOptions, resolveTsConfigFile } from './config'

export async function compileWithOptions (projectDir: string, outputDir: string, options?: MwccOptions) {
  projectDir = path.resolve(projectDir)
  if (options == null) {
    options = {}
  }
  const defaultOptions = getDefaultOptions(projectDir, outputDir)
  const compilerOptions = mergeCompilerOptions(defaultOptions.compilerOptions!, options.compilerOptions)

  const orchestration = new Orchestra(projectDir, { ...options, compilerOptions })
  const { summary, diagnostics } = await orchestration.run()

  fs.writeFileSync(path.join(orchestration.context.derivedOutputDir, 'midway.build.json'), JSON.stringify(summary))
  return { summary, diagnostics }
}

export async function compileInProject (projectDir: string, outputDir: string, options?: MwccOptions) {
  const cli = resolveTsConfigFile(projectDir)
  return compileWithOptions(projectDir, outputDir, { ...options, compilerOptions: cli.options })
}

export function findAndParseTsConfig (projectDir: string, configName?: string) {
  return resolveTsConfigFile(projectDir, configName)
}
