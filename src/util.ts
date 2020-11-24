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
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  return printer.printNode(
    ts.EmitHint.Unspecified,
    node,
    ts.createSourceFile('%%', '', ts.ScriptTarget.ESNext)
  );
}

export function safeJsonParse<T = any>(str: string): T | undefined {
  try {
    return JSON.parse(str);
  } catch {
    /** ignore */
  }
  return undefined;
}

export function tryCatch<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ...args: Parameters<T>
): { value?: ReturnType<T>; error?: unknown } {
  try {
    const value = fn(...args) as ReturnType<T>;
    return { value };
  } catch (error) {
    return { error };
  }
}

export const getSourceFileText = (nodeOrigin: ts.Node) => {
  let node = nodeOrigin;
  while (!ts.isSourceFile(node) && node.parent) {
    node = node.parent;
  }
  return node.getText();
};

export const getCodePositionInfo = (code: string, pos: number) => {
  try {
    const codeArr: string[] = code.substr(0, pos).split('\n');
    const ln = codeArr.length - 1;
    return {
      ln,
      col: codeArr[ln]?.length || 0,
      index: pos,
    };
  } catch {
    /** ignore */
  }
  return { ln: 0, col: 0, index: 0 };
};

export function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, '/');
}
