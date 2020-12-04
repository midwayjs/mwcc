import ts from 'typescript';
import Module from 'module';
import { TransformationContext } from '../transformation/transformation-context';
import path from 'path';
import { toUnix } from '../util';

export default {
  transform(ctx: TransformationContext) {
    const compilerOptions = ctx.getCompilerOptions();

    if (
      typeof compilerOptions.paths !== 'object' ||
      Object.keys(compilerOptions.paths).length === 0
    ) {
      return {};
    }

    return {
      // import xxx from '...'
      ImportDeclaration(node: ts.ImportDeclaration) {
        return updateImportExportDeclaration(
          node,
          ctx.getSourceFileName(node),
          compilerOptions
        );
      },
      // import xxx = require('xxx')
      ExternalModuleReference(node: ts.ExternalModuleReference) {
        const sourceFilePath = ctx.getSourceFileName(node);
        const moduleSpecifier = getModuleSpecifier(node.expression);

        if (!moduleSpecifier) {
          return node;
        }

        const { isAlias, target } = matchAliasPath(
          moduleSpecifier,
          sourceFilePath,
          compilerOptions
        );

        if (!isAlias) {
          return node;
        }

        updateSourceFileResolvedModules(
          node.getSourceFile(),
          target,
          moduleSpecifier
        );
        return ts.updateExternalModuleReference(
          node,
          ts.createStringLiteral(target)
        );
      },
      // type bar = typeof import("./bar").Bar;
      ImportType(node: ts.ImportTypeNode) {
        const sourceFilePath = ctx.getSourceFileName(node);
        const argument = node.argument as ts.LiteralTypeNode;

        const moduleSpecifier = getModuleSpecifier(argument.literal);
        if (!moduleSpecifier) {
          return node;
        }

        const { isAlias, target } = matchAliasPath(
          moduleSpecifier,
          sourceFilePath,
          compilerOptions
        );

        if (!isAlias) {
          return node;
        }

        updateSourceFileResolvedModules(
          node.getSourceFile(),
          target,
          moduleSpecifier
        );
        // ts.updateImportTypeNode is invalid
        return Object.assign(node, {
          argument: ts.createLiteralTypeNode(ts.createStringLiteral(target)),
        });
      },
      // export xxx from '...'
      ExportDeclaration(node: ts.ExportDeclaration) {
        return updateImportExportDeclaration(
          node,
          ctx.getSourceFileName(node),
          compilerOptions
        );
      },
      // import('xxx) or require('xxx')
      CallExpression(node: ts.CallExpression) {
        if (!isRequire(node) && !isAsyncImport(node)) {
          return node;
        }

        const sourceFilePath = ctx.getSourceFileName(node);
        const moduleSpecifier = getModuleSpecifier(node.arguments[0]);

        if (!moduleSpecifier) {
          return node;
        }

        const { isAlias, target } = matchAliasPath(
          moduleSpecifier,
          sourceFilePath,
          compilerOptions
        );

        if (!isAlias) {
          return node;
        }

        updateSourceFileResolvedModules(
          node.getSourceFile(),
          target,
          moduleSpecifier
        );
        return ts.updateCall(node, node.expression, node.typeArguments, [
          ts.createStringLiteral(target),
        ]);
      },
    };
  },
};

function matchAliasPath(
  moduleSpecifier: string,
  sourceFilePath: string,
  compilerOptions: ts.CompilerOptions
) {
  const extensions = getExtensions(compilerOptions);
  const coreModules = getCoreModules(Module?.builtinModules);

  if (coreModules[moduleSpecifier]) {
    return { isAlias: false, target: '' };
  }

  const { resolvedModule } = ts.resolveModuleName(
    moduleSpecifier,
    sourceFilePath,
    compilerOptions,
    ts.sys
  );

  if (!resolvedModule || resolvedModule.isExternalLibraryImport) {
    return { isAlias: false, target: '' };
  }

  const sourceFileDir = path.dirname(sourceFilePath);
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

  return {
    isAlias: true,
    target,
  };
}

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

function isRequire(node: ts.CallExpression): node is ts.CallExpression {
  return (
    ts.isIdentifier(node.expression) &&
    node.expression.getText() === 'require' &&
    ts.isStringLiteral(node.arguments[0]) &&
    node.arguments.length === 1
  );
}

function isAsyncImport(node: ts.CallExpression): node is ts.CallExpression {
  return (
    node.expression.kind === ts.SyntaxKind.ImportKeyword &&
    ts.isStringLiteral(node.arguments[0]) &&
    node.arguments.length === 1
  );
}

function getModuleSpecifier(node: ts.Node) {
  if (!node || !ts.isStringLiteral(node)) {
    return undefined;
  }
  return node.text;
}

function updateImportExportDeclaration(
  node: ts.ImportDeclaration | ts.ExportDeclaration,
  sourceFilePath: string,
  compilerOptions: ts.CompilerOptions
) {
  const moduleSpecifier = getModuleSpecifier(
    node.moduleSpecifier as ts.Expression
  );

  if (!moduleSpecifier) {
    return node;
  }

  const { isAlias, target } = matchAliasPath(
    moduleSpecifier,
    sourceFilePath,
    compilerOptions
  );

  if (!isAlias) {
    return node;
  }

  /**
   * Transforming ImportDeclaration or ExportDeclaration causes type specifiers to be output in js files
   * @see https://github.com/microsoft/TypeScript/issues/40603
   * @see https://github.com/microsoft/TypeScript/issues/31446
   */
  Object.assign(node, {
    moduleSpecifier: (ts as any).updateNode(
      ts.createStringLiteral(target),
      node.moduleSpecifier
    ),
  });
  updateSourceFileResolvedModules(
    node.getSourceFile(),
    target,
    moduleSpecifier
  );

  return node;
}

function updateSourceFileResolvedModules(
  sourceFile: ts.SourceFile,
  newModuleText: string,
  oldModuleText: string
) {
  const its = (ts as unknown) as InternalTS;
  const it = its.getResolvedModule(sourceFile, oldModuleText);
  its.setResolvedModule(sourceFile, newModuleText, it);
}

interface InternalTS {
  getResolvedModule(
    sourceFile: ts.SourceFile | undefined,
    moduleNameText: string
  ): unknown;
  setResolvedModule(
    sourceFile: ts.SourceFile,
    moduleNameText: string,
    resolvedModule: unknown
  ): void;
}
