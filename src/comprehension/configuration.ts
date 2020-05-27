import { query } from '../tsquery';
import { any } from '../util';
import ts = require('typescript');
import { ImportedName, resolveImportedName } from './module';

export interface IConfigurationProjectReference {
  moduleId: string;
}

export interface IConfigurationComprehension {
  imports: IConfigurationProjectReference[];
  configs: string[];
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
