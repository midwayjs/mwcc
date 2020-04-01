import childProcess = require('child_process')
import path = require('path')
import os = require('os')

const defaultTnvmDir = path.resolve(os.homedir(), '.tnvm')
const tnvmScriptPath = path.resolve(__dirname, '../../script/tnvm.sh')

export class TnvmAgent {
  private shell = this.findBash()
  // eslint-disable-next-line no-useless-constructor
  constructor (private tnvmDir: string = defaultTnvmDir) {}

  async listVersions (type: string): Promise<string[]> {
    try {
      const stdout = await this.exec('_tnvm_ls', [type], 'list versions failed')
      return stdout.split('\n')
    } catch { return [] }
  }

  async isVersionInstalled (version: string): Promise<boolean> {
    try {
      await this.exec('_tnvm_ensure_version_installed', [version], '')
      return true
    } catch { return false }
  }

  async getExecPathOfVersion (version: string): Promise<string | undefined> {
    let nodeDir
    try {
      nodeDir = await this.exec('_tnvm_version_path', [version], `get exec path of ${version} failed`)
    } catch {}
    if (!nodeDir) {
      return undefined
    }
    return path.join(nodeDir, 'bin/node')
  }

  async install (version: string) {
    return this.exec('tnvm', ['install', version], `install ${version} failed`)
  }

  async uninstall (version: string) {
    return this.exec('tnvm', ['uninstall', version], `uninstall ${version} failed`)
  }

  private async exec (command: string, args: string[], errDescription: string): Promise<string> {
    return new Promise((resolve, reject) => {
      childProcess.exec(`source ${tnvmScriptPath}; ${command} ${args.map(it => JSON.stringify(it)).join(' ')}`, {
        env: { ...process.env, TNVM_DIR: this.tnvmDir },
        shell: this.shell
      }, (error, stdout, stderr) => {
        if (error) {
          const err = new Error(errDescription)
          ;(err as any).stderr = stderr
          ;(err as any).reason = error
          return reject(err)
        }
        return resolve(stdout.trim())
      })
    })
  }

  private findBash () {
    const path = childProcess.execSync('type -p bash', { encoding: 'utf8' })
    return path.trim()
  }
}
