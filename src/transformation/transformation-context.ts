import { mixin, USE } from '../util';
import ts from 'typescript';
import {
  ImportedName,
  resolveImportedName as _resolveImportedNames,
} from '../comprehension/module';

export interface TransformationContext extends ts.TransformationContext {
  prependHelperStatements(...stmts: ts.Statement[]): void;
  getImportDeclarations(file: ts.SourceFile): ts.ImportDeclaration[];
  getModuleSpecifierValue(decl: ts.ImportDeclaration): string | undefined;
  getSourceFileName(node: ts.Node): string;
  resolveImportedNames(id: ts.Identifier): ImportedName[] | undefined;
  resolveDeclarations(node: ts.Node): ts.Node[];
}

/** @internal */
export interface TransformationContext {
  additionalHelperStatements: ts.Statement[];
  swapAdditionalHelperStatements(): ts.Statement[];
}

export function createTransformationContext(
  ctx: ts.TransformationContext,
  checker: ts.TypeChecker
): TransformationContext {
  const additionalHelperStatements: ts.Statement[] = [];
  const newCtx = {
    /** @internal */
    additionalHelperStatements,
    swapAdditionalHelperStatements,

    /** @public */
    prependHelperStatements,
    getImportDeclarations,
    getModuleSpecifierValue,
    getSourceFileName,
    resolveImportedNames,
    resolveDeclarations,
  };
  return mixin<ts.TransformationContext, typeof newCtx>(ctx, newCtx);

  function prependHelperStatements(...stmts: ts.Statement[]) {
    newCtx.additionalHelperStatements = newCtx.additionalHelperStatements.concat(
      stmts
    );
  }

  function swapAdditionalHelperStatements() {
    const stmts = newCtx.additionalHelperStatements;
    newCtx.additionalHelperStatements = [];
    return stmts;
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
    if (node.flags & ts.NodeFlags.Synthesized) {
      return [];
    }
    const symbol = checker.getSymbolAtLocation(node);
    if (symbol == null) {
      return undefined;
    }
    return _resolveImportedNames(symbol);
  }

  function resolveDeclarations(node: ts.Node): ts.Node[] {
    if (node.flags & ts.NodeFlags.Synthesized) {
      return [];
    }
    const symbol = checker.getSymbolAtLocation(node);
    if (symbol == null) {
      return [];
    }
    return symbol.declarations || [];
  }
}
