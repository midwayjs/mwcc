import ts from 'typescript';
import { TransformationContext } from '../../';

export default {
  transform: (ctx: TransformationContext) => {
    return {
      ImportDeclaration: (node: ts.ImportDeclaration) => {
        if (
          ts.isStringLiteral(node.moduleSpecifier) &&
          node.moduleSpecifier.text === 'assert'
        ) {
          ctx.createAndAddImportDeclaration(
            node.getSourceFile(),
            'power-assert',
            undefined
          );

          return node;
        }

        return node;
      },
    };
  },
};