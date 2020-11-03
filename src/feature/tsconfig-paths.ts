import ts from 'typescript';
import Module from 'module';
import fs from 'fs';
import { TransformationContext } from '../transformation/transformation-context';
import path from 'path';

export default {
  transform(ctx: TransformationContext) {
    const compilerOptions = ctx.getCompilerOptions();

    if (
      typeof compilerOptions.paths !== 'object' ||
      Object.keys(compilerOptions.paths).length === 0
    ) {
      return {};
    }

    const coreModules = getCoreModules(Module?.builtinModules);
    const extensions = getExtensions(compilerOptions);

    return {
      ImportDeclaration(node: ts.ImportDeclaration) {
        const sourceFilePath = ctx.getSourceFileName(node);
        const moduleSpecifier = ctx.getModuleSpecifierValue(node) as string;
        const isCoreModule = coreModules[moduleSpecifier];

        if (isCoreModule) {
          return node;
        }

        const { resolvedModule } = ts.resolveModuleName(
          moduleSpecifier,
          sourceFilePath,
          compilerOptions,
          ts.sys
        );

        if (!resolvedModule || resolvedModule.isExternalLibraryImport) {
          return node;
        }

        const sourceFileDir = path.parse(sourceFilePath).dir;
        let target = toUnix(
          path.normalize(
            path.relative(sourceFileDir, resolvedModule.resolvedFileName)
          )
        );

        if (
          resolvedModule.extension &&
          extensions.includes(resolvedModule.extension)
        ) {
          target = target.slice(0, -resolvedModule.extension.length);
        }

        target = target[0] === '.' ? target : `./${target}`;

        return ts.updateImportDeclaration(
          node,
          node.decorators,
          node.modifiers,
          node.importClause,
          ts.createStringLiteral(target)
        );
      },
    };
  },
};

function getCoreModules(
  builtinModules: string[] | undefined
): { [key: string]: boolean } {
  // The 'module.builtinModules' is not supported until Node.js 9.3.0
  builtinModules = builtinModules || [
    'assert',
    'buffer',
    'child_process',
    'cluster',
    'crypto',
    'dgram',
    'dns',
    'domain',
    'events',
    'fs',
    'http',
    'https',
    'net',
    'os',
    'path',
    'punycode',
    'querystring',
    'readline',
    'stream',
    'string_decoder',
    'tls',
    'tty',
    'url',
    'util',
    'v8',
    'vm',
    'zlib',
  ];

  const coreModules: { [key: string]: boolean } = {};
  for (const module of builtinModules) {
    coreModules[module] = true;
  }

  return coreModules;
}

function getExtensions(compilerOptions: ts.CompilerOptions) {
  const extensions = ['.ts', '.d.ts'];

  if (compilerOptions.allowJs) {
    extensions.push('.js');
  }

  if (compilerOptions.resolveJsonModule) {
    extensions.push('.json');
  }

  return extensions;
}

function toUnix(p: string) {
  if (process.platform === 'win32') {
    return p.split(path.sep).join(path.posix.sep);
  }
  return p;
}
