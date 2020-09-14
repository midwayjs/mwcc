import ts from 'typescript';
import { TransformationContext } from '../../src';
import { template } from '../../src/template';

export default {
  transform: (ctx: TransformationContext) => {
    return {
      Identifier: (node: ts.Identifier) => {
        const importedNames = ctx.resolveImportedNames(node);
        const moduleId = importedNames?.[0]?.moduleId;
        if (moduleId !== './foo') {
          return node;
        }

        const tpl = template('$.ID')({ ID: node });
        const expr = (tpl[0] as ts.ExpressionStatement).expression;
        return expr;
      },
    };
  },
};
