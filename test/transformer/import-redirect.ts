import ts from 'typescript';
import { TransformationContext } from '../../src';
import { USE } from '../../src/util';

export default {
  transform: (ctx: TransformationContext) => {
    USE(ctx);
    return {
      ImportDeclaration: (node: ts.ImportDeclaration) => {
        if (
          ts.isStringLiteral(node.moduleSpecifier) &&
          node.moduleSpecifier.text === 'assert'
        ) {
          return ts.updateImportDeclaration(
            node,
            node.decorators,
            node.modifiers,
            node.importClause,
            ts.createStringLiteral('power-assert'),
            undefined
          );
        }

        return node;
      },
    };
  },
};
