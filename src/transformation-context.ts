import { mixin, USE } from './util';
import ts = require('typescript');

export interface TransformationContext extends ts.TransformationContext {
  findAllReferences(node: ts.Node): ts.Node[];
  getImportDeclarations(file: ts.SourceFile): ts.ImportDeclaration[];
  getModuleSpecifierValue(decl: ts.ImportDeclaration): string | undefined;
}

export function createTransformationContext(
  ctx: ts.TransformationContext,
  languageService: ts.LanguageService
): TransformationContext {
  const newCtx = {
    findAllReferences,
    getImportDeclarations,
    getModuleSpecifierValue,
  };
  return mixin<ts.TransformationContext, typeof newCtx>(ctx, newCtx);

  function findAllReferences(node: ts.Node): ts.Node[] {
    const referencedSymbols = languageService.findReferences(
      node.getSourceFile().fileName,
      node.getStart()
    );
    if (referencedSymbols == null) {
      return [];
    }
    return Array.from(getReferencingNodes());

    function* getReferencingNodes() {
      for (const referencedSymbol of referencedSymbols!) {
        const isAlias =
          referencedSymbol.definition.kind === ts.ScriptElementKind.alias;
        const references = referencedSymbol.references;
        for (let i = 0; i < references.length; i++) {
          // the first reference always seems to be the main definition... the other definitions
          // could be constructed in initializers or elsewhere
          const reference = references[i];
          if (isAlias || !reference.isDefinition || i > 0) {
            yield getNodeAtPosition(reference.fileName, reference.textSpan);
          }
        }
      }
    }
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
