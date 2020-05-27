import ts from 'typescript';

export const nullTransformationContext: ts.TransformationContext = {
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
