import ts from 'typescript';

export function extend(...args) {
  return args.reduce((previous, current) => {
    if (current == null) {
      return previous;
    }
    if (typeof current !== 'object') {
      return previous;
    }
    for (const [key, val] of Object.entries(current)) {
      if (val === undefined) {
        continue;
      }
      previous[key] = val;
    }
    return previous;
  }, {});
}

class AssertionFailure extends Error {}

export function assert(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new AssertionFailure(message ?? 'Assert Failed');
  }
}

export function any<T>(arr: T[], match: (T) => boolean): boolean {
  for (const item of arr) {
    if (match(item)) {
      return true;
    }
  }
  return false;
}

export function mixin<T extends {}, R extends {}>(lhs: T, rhs: R): T & R {
  const it = {};
  Object.defineProperties(it, Object.getOwnPropertyDescriptors(lhs));
  Object.defineProperties(it, Object.getOwnPropertyDescriptors(rhs));
  return it as T & R;
}

export function chainBundle(
  transformSourceFile: (x: ts.SourceFile) => ts.SourceFile
): ts.Transformer<ts.SourceFile> {
  return transformSourceFileOrBundle as ts.Transformer<ts.SourceFile>;

  function transformSourceFileOrBundle(node: ts.SourceFile | ts.Bundle) {
    return node.kind === ts.SyntaxKind.SourceFile
      ? transformSourceFile(node)
      : transformBundle(node);
  }

  function transformBundle(node: ts.Bundle) {
    return ts.createBundle(
      node.sourceFiles.map(transformSourceFile),
      node.prepends
    );
  }
}

export function USE(...condition: any[]) {
  condition;
}

export function getCodeOfNode(node: ts.Node) {
  const printer = ts.createPrinter();
  return printer.printNode(
    ts.EmitHint.Unspecified,
    node,
    ts.createSourceFile('%%', '', ts.ScriptTarget.ESNext)
  );
}
