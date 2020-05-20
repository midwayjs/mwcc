import ts from 'typescript'
import { mixin, USE } from './util'

export function createLanguageServiceHost (host: ts.CompilerHost, cli: ts.ParsedCommandLine): ts.LanguageServiceHost {
  const langServHost = {
    getCompilationSettings,
    getScriptFileNames,
    getScriptVersion,
    getScriptSnapshot,
    writeFile
  }
  return mixin<ts.CompilerHost, typeof langServHost>(host, langServHost)

  function writeFile (fileName: string, data: string): void {
    return host.writeFile(fileName, data, false)
  }

  function getCompilationSettings (): ts.CompilerOptions {
    return cli.options
  }

  function getScriptFileNames (): string[] {
    return cli.fileNames
  }

  function getScriptVersion (fileName: string): string {
    USE(fileName)
    return '1'
  }

  function getScriptSnapshot (fileName: string): ts.IScriptSnapshot | undefined {
    USE(fileName)
    return undefined
  }
}
