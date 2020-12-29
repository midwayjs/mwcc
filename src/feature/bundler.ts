import * as path from 'path';
import * as childProcess from 'child_process';
import sourceMap from 'source-map';
import { isVersionInstalled, install, getExecPathOfVersion } from '../tnvm';
import ncc from '@midwayjs/ncc';
import { MwccContext } from '../program';
import ts from 'typescript';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function staticAssert(condition: any): asserts condition {}

export default async function bundle(ctx: MwccContext, host: ts.CompilerHost) {
  const bundleOpts = ctx.config.features!.bundler!;
  let outFiles: string[] = [];
  const files = ctx.files.map(it => path.normalize(it));

  for (let [entry, target] of Object.entries(bundleOpts.entries)) {
    let resolvedEntry;
    if (entry.startsWith('?') && typeof target === 'object') {
      resolvedEntry = path.resolve(
        ctx.buildDir,
        entry.substring(1) + '.generated.js'
      );
      host.writeFile(resolvedEntry, target.sourceCode, false);
      target = target.target;
    } else {
      entry = path.resolve(ctx.projectDir, entry);
      if (files.indexOf(entry) < 0) {
        throw new Error(
          `entry(${entry}) not included in compilation, included files(${files.join(
            ', '
          )})`
        );
      }
      resolvedEntry = ctx.config.features?.tsc
        ? ctx.getTsOutputPath(entry)
        : path.resolve(ctx.projectDir, entry);
    }

    staticAssert(typeof target === 'string');

    const realBuildDir = host.realpath!(ctx.buildDir);
    const targetFilePath = path.resolve(ctx.buildDir, target);
    const { code, map } = await ncc(resolvedEntry, {
      cache: false,
      externals: bundleOpts.externals,
      filename: target,
      sourceMap: true,
      sourceMapRegister: false,
      sourceMapBasePrefix: '',
      quiet: true,
    });

    const jsonMap = JSON.parse(map);
    jsonMap.sources = jsonMap.sources.map(it => {
      if (!path.isAbsolute(it)) {
        return path.relative(ctx.config.compilerOptions?.rootDir!, it);
      }
      return it.replace(realBuildDir, '/');
    });
    const calibratedMap = await calibrateSourceMaps(ctx, host, jsonMap);

    if (bundleOpts.codecache) {
      const [
        cachedDataFilePath,
        cachedCodeFilePath,
        targetFilepath,
      ] = await codecache(host, targetFilePath, code, bundleOpts.codecache);
      outFiles = outFiles.concat([
        cachedDataFilePath,
        cachedCodeFilePath,
        targetFilepath,
      ]);
      host.writeFile(`${cachedCodeFilePath}.map`, calibratedMap, false);
      outFiles.push(`${cachedCodeFilePath}.map`);
    } else {
      host.writeFile(targetFilePath, code, false);
      outFiles.push(targetFilePath);
      host.writeFile(`${targetFilePath}.map`, calibratedMap, false);
      outFiles.push(`${targetFilePath}.map`);
    }
  }

  ctx.outFiles = outFiles;
}

async function codecache(
  host: ts.CompilerHost,
  targetFilepath: string,
  code: string,
  nodejsVersion: string
) {
  const basename = path.basename(targetFilepath, '.js');
  const cachedDataFilePath = path.join(
    path.dirname(targetFilepath),
    basename + '.cache'
  );
  const cachedCodeFilePath = path.join(
    path.dirname(targetFilepath),
    basename + '.cache.js'
  );

  const columnOffset = -'(function (exports, require, module, __filename, __dirname) { '
    .length;
  const cachedEntry = `const { readFileSync } = require('fs'), { Script } = require('vm'), { wrap } = require('module');
const basename = __dirname + '/${basename}';
const source = readFileSync(basename + '.cache.js', 'utf-8');
const cachedData = !process.pkg && require('process').platform !== 'win32' && readFileSync(basename + '.cache');
const scriptOpts = { filename: basename + '.cache.js', columnOffset: ${columnOffset} }
const script = new Script(wrap(source), cachedData ? Object.assign({ cachedData }, scriptOpts) : scriptOpts);
(script.runInThisContext())(exports, require, module, __filename, __dirname);\n`;
  host.writeFile(cachedCodeFilePath, code, false);
  host.writeFile(targetFilepath, cachedEntry, false);

  nodejsVersion = nodejsVersion || 'node-' + process.version;
  const execPath = await resolveNodeBinary(nodejsVersion);
  if (execPath == null) {
    throw new Error(`Unable to resolve Node.js binary for ${nodejsVersion}`);
  }
  await spawn(execPath, [
    path.resolve(__dirname, '../../bin/codecache.js'),
    cachedCodeFilePath,
    cachedDataFilePath,
  ]);

  return [cachedDataFilePath, cachedCodeFilePath, targetFilepath];
}

async function resolveNodeBinary(variant: string) {
  const match = variant.match(/((?:ali)?node)-v(\d+\.\d+\.\d+(?:-\.+)?)/);
  if (match == null) {
    return null;
  }
  if (
    match[2] !== process.versions[match[1] as keyof typeof process.versions]
  ) {
    return resolveNodeBinaryByTnvm(variant);
  }
  return process.execPath;
}

async function resolveNodeBinaryByTnvm(variant) {
  const installed = await isVersionInstalled(variant);
  if (!installed) {
    await install(variant);
  }
  return getExecPathOfVersion(variant);
}

function spawn(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const cp = childProcess.spawn(command, args, { stdio: 'inherit' });
    cp.on('error', err => {
      reject(err);
    });
    cp.on('exit', (code: number) => {
      if (code > 0) {
        return reject(
          new Error(`command(${command}) exited with non-zero code.`)
        );
      }
      resolve();
    });
  });
}

async function calibrateSourceMaps(
  ctx: MwccContext,
  host: ts.CompilerHost,
  map: any
) {
  const consumer = await new sourceMap.SourceMapConsumer(map);
  consumer.sourceRoot = ctx.config.compilerOptions?.sourceRoot!;
  const generator = sourceMap.SourceMapGenerator.fromSourceMap(consumer);
  for (const source of map.sources) {
    const sourcePath = path.join(
      ctx.config.compilerOptions?.sourceRoot!,
      source
    );
    const sourceMapPath = path.resolve(
      ctx.config.compilerOptions?.rootDir!,
      sourcePath + '.map'
    );
    const sourceMapContent = host.readFile(sourceMapPath);
    if (sourceMapContent == null) {
      continue;
    }
    const consumer = await new sourceMap.SourceMapConsumer(sourceMapContent);
    generator.applySourceMap(consumer, sourcePath);
  }
  return generator.toString();
}
