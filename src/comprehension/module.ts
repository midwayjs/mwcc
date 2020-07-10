import ts from 'typescript';

export interface ImportedName {
  moduleId: string;
  exportedName?: string;
  importedName: string;
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
      const importDecl = closestAncestor(decl, ts.SyntaxKind.ImportDeclaration);
      if (importDecl == null) {
        continue;
      }
      const moduleId = resolveImportModuleId(importDecl);
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
    /**
     * One of:
     * - import <foo> from 'mod';
     */
    if (ts.isImportClause(decl)) {
      const importDecl = closestAncestor(decl, ts.SyntaxKind.ImportDeclaration);
      if (importDecl == null) {
        continue;
      }
      const moduleId = resolveImportModuleId(importDecl);
      if (moduleId == null) {
        continue;
      }
      results.push({
        moduleId,
        importedName: decl.name!.getText(),
      });
      continue;
    }

    /**
     * One of:
     * - <import foo = require('mod')>;
     */
    if (ts.isImportEqualsDeclaration(decl)) {
      const moduleId = resolveImportModuleId(decl);
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
     * - const <foo = require('mod')>;
     * - TODO: const <foo = require('mod').foo.bar>;
     */
    if (ts.isVariableDeclaration(decl)) {
      const moduleId = resolveImportModuleId(decl);
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
      const variableDeclaration = closestAncestor(
        decl,
        ts.SyntaxKind.VariableDeclaration
      );
      if (variableDeclaration == null) {
        continue;
      }
      const moduleId = resolveImportModuleId(variableDeclaration);
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
