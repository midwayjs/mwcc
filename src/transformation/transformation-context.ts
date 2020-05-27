import { mixin, USE } from '../util';
import ts = require('typescript');

export interface TransformationContext extends ts.TransformationContext {
  createAndAddImportDeclaration(file: ts.SourceFile, moduleSpecifier: string, importClause: ts.ImportClause | undefined): ts.ImportDeclaration;
  getImportDeclarations(file: ts.SourceFile): ts.ImportDeclaration[];
  getModuleSpecifierValue(decl: ts.ImportDeclaration): string | undefined;
}

/** @internal */
export interface TransformationContext {
  additionalImportDeclarations: ts.ImportDeclaration[];
}

export function createTransformationContext(
  ctx: ts.TransformationContext,
): TransformationContext {
  const additionalImportDeclarations: ts.ImportDeclaration[] = [];
  const newCtx = {
    additionalImportDeclarations,
    createAndAddImportDeclaration,
    getImportDeclarations,
    getModuleSpecifierValue,
  };
  return mixin<ts.TransformationContext, typeof newCtx>(ctx, newCtx);

  function createAndAddImportDeclaration(file: ts.SourceFile, moduleSpecifier: string, importClause: ts.ImportClause): ts.ImportDeclaration {
    const decl = ts.createImportDeclaration([], [], importClause, ts.createStringLiteral(moduleSpecifier));
    additionalImportDeclarations.push(decl);
    return decl;
  }

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
