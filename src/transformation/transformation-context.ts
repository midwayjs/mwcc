import { mixin, USE } from '../util';
import ts = require('typescript');

export interface TransformationContext extends ts.TransformationContext {
  createAndAddImportDeclaration(
    file: ts.SourceFile,
    moduleSpecifier: string,
    importClause: ts.ImportClause | undefined
  ): ts.ImportDeclaration;
  getImportDeclarations(file: ts.SourceFile): ts.ImportDeclaration[];
  getModuleSpecifierValue(decl: ts.ImportDeclaration): string | undefined;
  getSourceFileName(node: ts.Node): string;
}

/** @internal */
export interface TransformationContext {
  additionalImportDeclarations: ts.ImportDeclaration[];
}

export function createTransformationContext(
  ctx: ts.TransformationContext
): TransformationContext {
  const additionalImportDeclarations: ts.ImportDeclaration[] = [];
  const newCtx = {
    additionalImportDeclarations,
    createAndAddImportDeclaration,
    getImportDeclarations,
    getModuleSpecifierValue,
    getSourceFileName,
  };
  return mixin<ts.TransformationContext, typeof newCtx>(ctx, newCtx);

  function createAndAddImportDeclaration(
    file: ts.SourceFile,
    moduleSpecifier: string,
    importClause: ts.ImportClause
  ): ts.ImportDeclaration {
    const decl = ts.createImportDeclaration(
      [],
      [],
      importClause,
      ts.createStringLiteral(moduleSpecifier)
    );
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

  function getSourceFileName(node: ts.Node): string {
    const sourceFile = node.getSourceFile();
    return sourceFile.fileName;
  }
}
