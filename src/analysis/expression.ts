import ts from 'typescript';
import { getSourceFileText, getPosition } from './utils';
export const getExpressionBaseInfo = (expression) => {
  if (!expression?.expression || !ts.isCallExpression(expression)) {
    return;
  }
  const code = getSourceFileText(expression);

  let params = [];
  if (expression.arguments?.length) {
    // params = this.formatParams(expression.arguments);
  }
  const expressionName: string = (expression.expression as ts.Identifier).escapedText.toString();
  return {
    expressionName,
    params,
    position: {
      range: {
        start: expression.pos,
        end: expression.end,
      },
      start: getPosition(code, expression.pos),
      end: getPosition(code, expression.end),
    },
  };
};