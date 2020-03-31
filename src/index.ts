import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'
import Orchestra from './orchestra'
import { MwccOptions } from './iface'
import { mergeCompilerOptions, getDefaultOptions, resolveTsConfigFile } from './config'

export async function compileWithOptions (projectDir: string, outDir: string, options?: MwccOptions) {
  projectDir = path.resolve(projectDir)
  if (options == null) {
    options = {}
  }
  const defaultOptions = getDefaultOptions(projectDir, outDir)
  const targetCli = ts.convertCompilerOptionsFromJson(options.compilerOptions, projectDir)
  const compilerOptions = mergeCompilerOptions(defaultOptions.compilerOptions!, targetCli.options, projectDir)

  const orchestration = new Orchestra(projectDir, { ...options, compilerOptions })
  const { summary, diagnostics } = await orchestration.run()

  fs.writeFileSync(path.join(orchestration.context.derivedOutputDir, 'midway.build.json'), JSON.stringify(summary))
  return { summary, diagnostics }
}

export async function compileInProject (projectDir: string, outDir: string, options?: MwccOptions) {
  const cli = resolveTsConfigFile(projectDir, outDir)
  return compileWithOptions(projectDir, outDir, { ...options, compilerOptions: cli.options })
}

export const findAndParseTsConfig = resolveTsConfigFile
