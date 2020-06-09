import ts from 'typescript';
import { TransformationContext, template } from '../../src';

export default {
  transform: (ctx: TransformationContext) => {
    return {
      ImportDeclaration: (node: ts.ImportDeclaration) => {
        if (
          ts.isStringLiteral(node.moduleSpecifier) &&
          node.moduleSpecifier.text === 'assert'
        ) {
          const decl = ts.createImportDeclaration(
            [],
            [],
            ts.createImportClause(ts.createTempVariable(undefined), undefined),
            ts.createStringLiteral('power-assert')
          );
          ctx.prependHelperStatements(
            decl,
            ...template('ASSERT.assert(true)')({
              ASSERT: ts.getGeneratedNameForNode(decl),
            })
          );
          return node;
        }

        return node;
      },
    };
  },
};
