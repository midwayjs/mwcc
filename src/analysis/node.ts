import ts from 'typescript';
import { getSourceFileText, getPosition } from './utils';
export const geNodeInfo = (node: ts.Node, checker: ts.TypeChecker) => {
  let type = '';
  let params;
  let response;
  const name = (node as any)?.name?.escapedText || '';
  const code = getSourceFileText(node);
  if (ts.isClassDeclaration(node)) {
    type = 'class';
  } else if (ts.isMethodDeclaration(node)) {
    type = 'method';
    params = node?.parameters?.map((param) => {
      const symbolParams =checker.getSymbolAtLocation(param.name);
      return; // Todo 
    });
    const symbol = checker.getSymbolAtLocation((node as any).name);
    const { checkerType } = getType((symbol as ts.Symbol), checker);
    const signatures = checkerType.getCallSignatures()[0];
    // Todo: response = serializeType(signatures.getReturnType());
  } else if (ts.isConstructorDeclaration(node)) {
    type = 'constructor';
  } else if (ts.isPropertyDeclaration(node)) {
    type = 'property';
  } else {
    // Todo: ('flags--', node.kind, node);
  }

  const target = {
    type,
    name,
    params,
    response,
    position: {
      range: {
        start: node.pos,
        end: node.end,
      },
      start: getPosition(code, node.pos),
      end: getPosition(code, node.end),
    },
  };

  return target;
};

const getType = (symbol: ts.Symbol, checker) => {
  const checkerType: ts.Type = checker.getTypeOfSymbolAtLocation(
    symbol,
    symbol.valueDeclaration,
  );
  return {
    type: checker.typeToString(checkerType).toLowerCase(),
    checkerType,
  };
}