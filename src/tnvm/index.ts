import { TnvmAgent } from './tnvm';

const defaultAgent = new TnvmAgent();

export function listVersions(type: string) {
  return defaultAgent.listVersions(type);
}

export function isVersionInstalled(version: string) {
  return defaultAgent.isVersionInstalled(version);
}

export function getExecPathOfVersion(version: string) {
  return defaultAgent.getExecPathOfVersion(version);
}

export function install(version: string) {
  return defaultAgent.install(version);
}
