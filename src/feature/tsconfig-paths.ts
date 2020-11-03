import ts from 'typescript';
import { loadConfig, createMatchPath } from 'tsconfig-paths';
import Module from 'module';
import fse from 'fs-extra';
import { TransformationContext } from '../transformation/transformation-context';

export default {
  transform(ctx: TransformationContext) {
    const config = loadConfig(ctx.getCompilerOptions().rootDir);

    if (config.resultType !== 'success') {
      return {};
    }

    const matchPath = createMatchPath(
      config.absoluteBaseUrl,
      config.paths,
      config.mainFields,
      config.addMatchAll
    );
    const coreModules = getCoreModules(Module?.builtinModules);

    return {
      ImportDeclaration(node: ts.ImportDeclaration) {
        const moduleSpecifier = ctx.getModuleSpecifierValue(node) as string;
        const isCoreModule = coreModules[moduleSpecifier];

        if (isCoreModule) {
          return node;
        }

        const found = matchPath(
          moduleSpecifier,
          fse.readJSONSync,
          fse.pathExistsSync,
          ['.js', '.ts', '.json']
        );

        if (!found) {
          return node;
        }

        return ts.updateImportDeclaration(
          node,
          node.decorators,
          node.modifiers,
          node.importClause,
          ts.createStringLiteral(found)
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
