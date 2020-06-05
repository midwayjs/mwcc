import ts from 'typescript';
import { TransformationContext } from '../../src';

export default {
  transform: (ctx: TransformationContext) => {
    return {
      ImportDeclaration: (node: ts.ImportDeclaration) => {
        if (
          ts.isStringLiteral(node.moduleSpecifier) &&
          node.moduleSpecifier.text === 'assert'
        ) {
          const id = ts.createTempVariable(undefined);
          ctx.prependHelperStatements(
            ts.createImportDeclaration(
              [],
              [],
              ts.createImportClause(id, undefined),
              ts.createStringLiteral('power-assert')
            )
          );

          return node;
        }

        return node;
      },
    };
  },
};
