import ts from 'typescript';
import { TransformationContext } from '../../src';
import { template } from '../../src/template';
import { USE } from '../../src/util';

export default {
  transform: (ctx: TransformationContext) => {
    USE(ctx);
    const tpl = template('IDENTIFIER.bind(this)');
    const buildBind = id =>
      (tpl({ IDENTIFIER: id })[0] as ts.ExpressionStatement).expression;
    return {
      'CallExpression Identifier': (node: ts.Identifier) => {
        if (node.text.startsWith('use')) {
          return buildBind(node);
        }

        return node;
      },
    };
  },
};
