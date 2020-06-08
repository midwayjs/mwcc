import ts from 'typescript';

interface InternalTransformationContext {
  /* @internal */ getEmitResolver(): any;
  /* @internal */ getEmitHost(): any;
  /* @internal */ setLexicalEnvironmentFlags(): void;
  /* @internal */ getLexicalEnvironmentFlags(): any;
  /* @internal */ addInitializationStatement(node: ts.Statement): void;
  /* @internal */ addDiagnostic(): void;
}

export const nullTransformationContext: ts.TransformationContext &
  InternalTransformationContext = {
  enableEmitNotification: noop,
  enableSubstitution: noop,
  endLexicalEnvironment: returnUndefined,
  getCompilerOptions: () => ({}),
  getEmitHost: notImplemented,
  getEmitResolver: notImplemented,
  setLexicalEnvironmentFlags: noop,
  getLexicalEnvironmentFlags: () => 0,
  hoistFunctionDeclaration: noop,
  hoistVariableDeclaration: noop,
  addInitializationStatement: noop,
  isEmitNotificationEnabled: notImplemented,
  isSubstitutionEnabled: notImplemented,
  onEmitNode: noop,
  onSubstituteNode: notImplemented,
  readEmitHelpers: notImplemented,
  requestEmitHelper: noop,
  resumeLexicalEnvironment: noop,
  startLexicalEnvironment: noop,
  suspendLexicalEnvironment: noop,
  addDiagnostic: noop,
};

function noop(_?: {} | null | undefined): void {}
function returnUndefined(): undefined {
  return undefined;
}
function notImplemented(): never {
  throw new Error('Not implemented');
}
