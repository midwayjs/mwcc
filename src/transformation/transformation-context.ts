import { mixin, USE } from '../util';
import ts = require('typescript');
import {
  ImportedName,
  resolveImportedName as _resolveImportedNames,
} from '../comprehension/module';

export interface TransformationContext extends ts.TransformationContext {
  createAndAddImportDeclaration(
    file: ts.SourceFile,
    moduleSpecifier: string,
    importClause: ts.ImportClause | undefined
  ): ts.ImportDeclaration;
  getImportDeclarations(file: ts.SourceFile): ts.ImportDeclaration[];
  getModuleSpecifierValue(decl: ts.ImportDeclaration): string | undefined;
  getSourceFileName(node: ts.Node): string;
  resolveImportedNames(id: ts.Identifier): ImportedName[] | undefined;
  resolveDeclarations(node: ts.Node): ts.Node[];
}

/** @internal */
export interface TransformationContext {
  additionalImportDeclarations: ts.ImportDeclaration[];
}

export function createTransformationContext(
  ctx: ts.TransformationContext,
  checker: ts.TypeChecker
): TransformationContext {
  const additionalImportDeclarations: ts.ImportDeclaration[] = [];
  const newCtx = {
    additionalImportDeclarations,
    createAndAddImportDeclaration,
    getImportDeclarations,
    getModuleSpecifierValue,
    getSourceFileName,
    resolveImportedNames,
    resolveDeclarations,
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

  function resolveImportedNames(
    node: ts.Identifier
  ): ImportedName[] | undefined {
    const symbol = checker.getSymbolAtLocation(node);
    if (symbol == null) {
      return undefined;
    }
    return _resolveImportedNames(symbol);
  }

  function resolveDeclarations(node: ts.Node): ts.Node[] {
    const symbol = checker.getSymbolAtLocation(node);
    if (symbol == null) {
      return [];
    }
    return symbol.declarations;
  }
}
