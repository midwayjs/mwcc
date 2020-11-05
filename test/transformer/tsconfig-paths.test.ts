import ts from 'typescript';
import { TransformationContext } from '../../src';

export default {
  transform: (ctx: TransformationContext) => {
    return {
      Identifier: (node: ts.Identifier) => {
        ctx.resolveDeclarations(node);
        return node;
      },
    };
  },
};
