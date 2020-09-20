import ts from 'typescript';
import { getSourceFileText, getCodePositionInfo } from '../util';
import { formatParams } from './params';
export const getExpressionBaseInfo = expression => {
  if (!expression?.expression || !ts.isCallExpression(expression)) {
    return;
  }
  const code = getSourceFileText(expression);

  let params: any = [];
  if (expression.arguments?.length) {
    params = formatParams(expression.arguments);
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
      start: getCodePositionInfo(code, expression.pos),
      end: getCodePositionInfo(code, expression.end),
    },
  };
};
