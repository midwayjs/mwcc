import ts from 'typescript';
import { TransformationContext, template } from '../../src';
import { USE } from '../../src/util';

export default {
  transform: (ctx: TransformationContext) => {
    USE(ctx);
    return {
      ClassDeclaration: (node: ts.ClassDeclaration) => {
        return template('@Foo() class NAME{}')({ NAME: node.name! })[0];
      },
    };
  },
};
