import ts from 'typescript';
import { TransformationContext } from '../../';
import { template } from '../../src/template';
import { USE } from '../../src/util';

export default {
  transform: (ctx: TransformationContext) => {
    USE(ctx);
    const tpl = template('IDENTIFIER.bind(this)');
    const buildBind = id =>
      (tpl({ IDENTIFIER: id })[0] as ts.ExpressionStatement).expression;
    return {
      ArrowFunction: (node: ts.ArrowFunction) => {
        if (
          ts.isVariableDeclaration(node.parent) &&
          ts.isVariableDeclarationList(node.parent.parent) &&
          ts.isVariableStatement(node.parent.parent.parent) &&
          node.parent.parent.parent.modifiers?.find(
            it => it.kind === ts.SyntaxKind.ExportKeyword
          ) != null
        ) {
          const body = ts.isBlock(node.body)
            ? node.body
            : ts.createBlock([ts.createExpressionStatement(node.body)]);
          const expr = ts.createFunctionExpression(
            node.modifiers,
            node.asteriskToken,
            node.name,
            node.typeParameters,
            node.parameters,
            node.type,
            body
          );
          return expr;
        }
        return node;
      },
      'CallExpression Identifier': (node: ts.Identifier) => {
        if (node.text.startsWith('use')) {
          const synthetic = buildBind(node);
          synthetic.parent = node.parent;
          return synthetic;
        }

        return node;
      },
    };
  },
};
