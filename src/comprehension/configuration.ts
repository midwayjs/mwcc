import { query } from '../tsquery';
import { any } from '../util';
import ts = require('typescript');

export interface IConfigurationProjectReference {
  moduleId: string;
}

export interface IConfigurationComprehension {
  imports: IConfigurationProjectReference[];
  configs: string[];
}

interface ImportedName {
  moduleId: string;
  exportedName?: string;
  importedName: string;
}

export function parseConfiguration(program: ts.Program) {
  const fileNames = program.getRootFileNames();
  const result: IConfigurationComprehension = {
    imports: [],
    configs: [],
  };
  for (const fileName of fileNames) {
    const sourceFile = program.getSourceFile(fileName)!;
    const config = parseConfigurationInFile(sourceFile, program);
    result.imports = result.imports.concat(config.imports);
    result.configs = result.configs.concat(config.configs);
  }

  return result;
}

function parseConfigurationInFile(
  sourceFile: ts.SourceFile,
  program: ts.Program
) {
  if (sourceFile.fileName.endsWith('.js')) {
    return parseConfigurationInJS(sourceFile, program);
  }
  const decorators = query(
    sourceFile,
    'ClassDeclaration Decorator'
  ) as ts.Decorator[];
  const result: IConfigurationComprehension = {
    imports: [],
    configs: [],
  };

  for (const decorator of decorators) {
    const config = resolveDecoratorCallExpression(
      decorator.expression,
      program
    );
    if (config) {
      result.imports = result.imports.concat(config.imports);
      result.configs = result.configs.concat(config.configs);
    }
  }

  return result;
}

function parseConfigurationInJS(
  sourceFile: ts.SourceFile,
  program: ts.Program
) {
  const decorations = query(
    sourceFile,
    'CallExpression[expression.escapedText="___decorate"]'
  ) as ts.CallExpression[];
  const result: IConfigurationComprehension = {
    imports: [],
    configs: [],
  };

  for (const decoration of decorations) {
    if (!ts.isCallExpression(decoration)) {
      continue;
    }
    const arg = decoration.arguments[0];
    if (!ts.isArrayLiteralExpression(arg)) {
      continue;
    }
    for (const decoratorExpression of arg.elements) {
      const config = resolveDecoratorCallExpression(
        decoratorExpression,
        program
      );
      if (config) {
        result.imports = result.imports.concat(config.imports);
        result.configs = result.configs.concat(config.configs);
      }
    }
  }

  return result;
}

function resolveDecoratorCallExpression(
  expression: ts.Node,
  program: ts.Program
) {
  if (!ts.isCallExpression(expression)) {
    return;
  }
  const arg = expression.arguments[0];
  if (!ts.isObjectLiteralExpression(arg)) {
    return;
  }
  if (ts.isIdentifier(expression.expression)) {
    const symbol = program
      .getTypeChecker()
      .getSymbolAtLocation(expression.expression)!;
    if (any(resolveImportedName(symbol), isMidwayJsConfigurationDecorator)) {
      const config = resolveConfiguration(arg);
      return config;
    }
  }
  if (ts.isPropertyAccessExpression(expression.expression)) {
    const expr = expression.expression;
    if (!ts.isIdentifier(expr.expression) || !ts.isIdentifier(expr.name)) {
      return;
    }
    const symbol = program
      .getTypeChecker()
      .getSymbolAtLocation(expr.expression)!;
    if (
      any(resolveImportedName(symbol), mod =>
        isMidwayJsConfigurationDecorator(mod, expr.name.escapedText as string)
      )
    ) {
      const config = resolveConfiguration(arg);
      return config;
    }
  }
  return undefined;
}

function isRequireCallExpression(node: ts.Node): node is ts.CallExpression {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.escapedText === 'require'
  );
}

function findRequireCallExpression(
  node: ts.Node
): ts.CallExpression | undefined {
  if (isRequireCallExpression(node)) {
    return node;
  }
  return ts.forEachChild(node, child => {
    return findRequireCallExpression(child);
  });
}

export function resolveImportedName(symbol: ts.Symbol) {
  const results: ImportedName[] = [];
  for (const decl of symbol.declarations) {
    /**
     * One of:
     * - import { <foo> } from 'mod';
     * - import { <foo as bar> } from 'mod';
     */
    if (ts.isImportSpecifier(decl)) {
      results.push({
        moduleId: resolveImportModuleId(
          closestAncestor(decl, ts.SyntaxKind.ImportDeclaration)!
        )!,
        exportedName: decl.propertyName?.getText() ?? decl.name.getText(),
        importedName: decl.name.getText(),
      });
      continue;
    }
    /**
     * One of:
     * - import <foo> from 'mod';
     */
    if (ts.isImportClause(decl)) {
      results.push({
        moduleId: resolveImportModuleId(
          closestAncestor(decl, ts.SyntaxKind.ImportDeclaration)!
        )!,
        importedName: decl.name!.getText(),
      });
      continue;
    }

    /**
     * One of:
     * - <import foo = require('mod')>;
     */
    if (ts.isImportEqualsDeclaration(decl)) {
      results.push({
        moduleId: resolveImportModuleId(decl)!,
        importedName: decl.name.getText(),
      });
      continue;
    }

    /**
     * One of:
     * - const <foo = require('mod')>;
     * - TODO: const <foo = require('mod').foo.bar>;
     */
    if (ts.isVariableDeclaration(decl)) {
      const moduleId = resolveImportModuleId(decl)!;
      if (moduleId == null) {
        continue;
      }
      results.push({
        moduleId,
        importedName: decl.name.getText(),
      });
      continue;
    }

    /**
     * One of:
     * - const { <foo: bar> } = require('mod');
     * - TODO: const { <foo: bar> } = require('mod').foo;
     */
    if (ts.isBindingElement(decl)) {
      const moduleId = resolveImportModuleId(
        closestAncestor(decl, ts.SyntaxKind.VariableDeclaration)!
      );
      if (moduleId == null) {
        continue;
      }
      results.push({
        moduleId,
        exportedName: decl.propertyName?.getText() ?? decl.name.getText(),
        importedName: decl.name.getText(),
      });
      continue;
    }
  }
  return results;
}

function resolveImportModuleId(node: ts.Node) {
  /**
   * One of:
   * - import x from 'mod';
   * - import {} from 'mod';
   * - import {} = require('mod');
   */
  if (ts.isImportDeclaration(node)) {
    return resolveModuleSpecifier(node.moduleSpecifier);
  }
  /**
   * One of:
   * - import x = require("mod");
   * - import x = M.x;
   */
  if (ts.isImportEqualsDeclaration(node)) {
    return resolveModuleReference(node.moduleReference);
  }

  if (ts.isVariableDeclaration(node) && node.initializer !== undefined) {
    const requireCallExpression = findRequireCallExpression(node.initializer);
    const modIdExpr = requireCallExpression?.arguments[0];
    if (modIdExpr == null || !ts.isStringLiteral(modIdExpr)) {
      return;
    }
    return modIdExpr.text;
  }

  return undefined;
}

function resolveModuleSpecifier(node: ts.Expression) {
  // import ... from 'foo'
  if (ts.isStringLiteral(node)) {
    return node.text;
  }
  // import {} = require('mod');
  if (ts.isBinaryExpression(node) && isRequireCallExpression(node.right)) {
    if (ts.isStringLiteral(node.right.arguments[0])) {
      return node.right.arguments[0].getText();
    }
  }
  return undefined;
}

function resolveModuleReference(node: ts.ModuleReference) {
  /**
   * One of:
   * - import foo = require('mod');
   */
  if (
    ts.isExternalModuleReference(node) &&
    ts.isStringLiteral(node.expression)
  ) {
    return node.expression.text;
  }
  return undefined;
}

function closestAncestor(node: ts.Node, kind: ts.SyntaxKind) {
  let parent = node.parent;
  while (parent != null) {
    if (parent.kind === kind) {
      return parent;
    }
    parent = parent.parent;
  }
  return undefined;
}

function isMidwayJsConfigurationDecorator(
  mod: ImportedName,
  accessName?: string
) {
  if (mod.moduleId !== '@midwayjs/decorator') {
    return false;
  }
  const exportedName = accessName ?? mod.exportedName;
  if (exportedName === 'Configuration') {
    return true;
  }
  return false;
}

function resolveConfiguration(node: ts.ObjectLiteralExpression) {
  const configuration: IConfigurationComprehension = {
    imports: [],
    configs: [],
  };
  for (const prop of node.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      continue;
    }
    if (!ts.isIdentifier(prop.name!)) {
      continue;
    }
    if (
      prop.name.escapedText === 'imports' &&
      ts.isArrayLiteralExpression(prop.initializer)
    ) {
      configuration.imports = castArrayLiteralExpressionToStringArray(
        prop.initializer
      ).map(it => ({ moduleId: it }));
    }
    if (
      prop.name.escapedText === 'configs' &&
      ts.isArrayLiteralExpression(prop.initializer)
    ) {
      configuration.configs = castArrayLiteralExpressionToStringArray(
        prop.initializer
      );
    }
  }
  return configuration;
}

function castArrayLiteralExpressionToStringArray(
  literal: ts.ArrayLiteralExpression
) {
  return literal.elements
    .map(it => {
      if (!ts.isStringLiteral(it)) {
        return;
      }
      return it.text;
    })
    .filter(it => !!it) as string[];
}
