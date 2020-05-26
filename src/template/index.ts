import ts from 'typescript';

export function template(
  str: string,
  languageVersion: ts.ScriptTarget = ts.ScriptTarget.ESNext,
  scriptKind: ts.ScriptKind = ts.ScriptKind.TS
) {
  const source = ts.createSourceFile(
    '%%template%%',
    str,
    languageVersion,
    false,
    scriptKind
  );
  return (options: { [key: string]: ts.Node }) => {
    const transformed = ts.visitEachChild(
      source,
      visitor,
      nullTransformationContext
    );
    return transformed.statements;

    function visitor(node: ts.Node): ts.Node {
      if (!ts.isIdentifier(node)) {
        return ts.visitEachChild(node, visitor, nullTransformationContext);
      }
      const replacement = options[node.text];
      if (replacement == null) {
        return node;
      }
      return replacement;
    }
  };
}

const nullTransformationContext: ts.TransformationContext = {
  enableEmitNotification: noop,
  enableSubstitution: noop,
  endLexicalEnvironment: returnUndefined,
  getCompilerOptions: notImplemented,
  hoistFunctionDeclaration: noop,
  hoistVariableDeclaration: noop,
  isEmitNotificationEnabled: notImplemented,
  isSubstitutionEnabled: notImplemented,
  onEmitNode: noop,
  onSubstituteNode: notImplemented,
  readEmitHelpers: notImplemented,
  requestEmitHelper: noop,
  resumeLexicalEnvironment: noop,
  startLexicalEnvironment: noop,
  suspendLexicalEnvironment: noop,
};

function noop(_?: {} | null | undefined): void {}
function returnUndefined(): undefined {
  return undefined;
}
function notImplemented(): never {
  throw new Error('Not implemented');
}
