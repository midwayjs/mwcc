import ts from 'typescript';
export const formatParams = (
  args: ts.NodeArray<ts.Expression | ts.ParameterDeclaration>
) => {
  return args.map((arg: any) => {
    if (arg.name) {
      return arg.name.escapedText;
    }
    if (arg.text) {
      return arg.text;
    }
    if (arg.symbol) {
      const symbol = getParamBySymbol(arg.symbol);
      return symbol;
    }
    if (arg.elements) {
      return formatParams(arg.elements);
    }
    return '';
  });
};

export const getTypeByKind = kind => {
  switch (kind) {
    case ts.SyntaxKind.NumericLiteral:
    case ts.SyntaxKind.BigIntLiteral:
      return 'number';
    case ts.SyntaxKind.StringLiteral:
      return 'string';
    case ts.SyntaxKind.ArrayLiteralExpression:
      return 'array';
    case ts.SyntaxKind.ObjectLiteralExpression:
      return 'object';
    case ts.SyntaxKind.FalseKeyword:
      return 'false';
    case ts.SyntaxKind.TrueKeyword:
      return 'true';
  }
  return 'unknown';
};

export const getParamBySymbol = (symbol: ts.Symbol) => {
  let type;
  let text = (symbol as any)?.text;
  const valueDeclaration: any = symbol?.valueDeclaration || symbol;
  if (valueDeclaration) {
    if (valueDeclaration.initializer) {
      text =
        valueDeclaration.initializer.text ||
        valueDeclaration.initializer.name?.escapedText ||
        text ||
        '';
      type = getTypeByKind(valueDeclaration.initializer.kind);
    } else {
      type = getTypeByKind(valueDeclaration.kind);
    }
  }

  switch (type) {
    case 'string':
      return text;
    case 'number':
      return +(text || 0);
    case 'array':
      return (valueDeclaration?.initializer?.elements || []).map(item => {
        return getParamBySymbol(item);
      });
    case 'false':
      return false;
    case 'true':
      return true;
    case 'object': {
      const param: any = {};
      if (symbol.members) {
        symbol.members.forEach((value, key) => {
          param[key as string] = getParamBySymbol(value);
        });
      }
      return param;
    }
  }
  return text;
};
