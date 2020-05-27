import { mixin, USE } from './util';
import ts = require('typescript');

export interface TransformationContext extends ts.TransformationContext {
  getImportDeclarations(file: ts.SourceFile): ts.ImportDeclaration[];
  getModuleSpecifierValue(decl: ts.ImportDeclaration): string | undefined;
}

export function createTransformationContext(
  ctx: ts.TransformationContext,
): TransformationContext {
  const newCtx = {
    getImportDeclarations,
    getModuleSpecifierValue,
  };
  return mixin<ts.TransformationContext, typeof newCtx>(ctx, newCtx);

  function getImportDeclarations(file: ts.SourceFile): ts.ImportDeclaration[] {
    // TODO:
    USE(file);
    return [];
  }

  function getModuleSpecifierValue(
    decl: ts.ImportDeclaration
  ): string | undefined {
    const { moduleSpecifier } = decl;
    if (!ts.isStringLiteral(moduleSpecifier)) {
      return undefined;
    }
    return moduleSpecifier.text;
  }

  function getNodeAtPosition(filename: string, span: ts.TextSpan): ts.Node {
    // TODO:
    USE(filename, span);
    return {} as any;
  }
}
