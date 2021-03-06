import ts from 'typescript';
import { nullTransformationContext } from '../transformation/null-transformation-context';
import { Mutable } from '../util';

export function template(
  str: string,
  languageVersion: ts.ScriptTarget = ts.ScriptTarget.ESNext,
  scriptKind: ts.ScriptKind = ts.ScriptKind.TS
) {
  const source = ts.createSourceFile(
    '%%template%%',
    str,
    languageVersion,
    true,
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
      markNodeSynthesized(node);
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

type MutablePositionNode = Mutable<ts.Node, 'pos' | 'end' | 'flags'>;

function markNodeSynthesized(_node: ts.Node) {
  const node = _node as MutablePositionNode;
  node.pos = -1;
  node.end = -1;
  node.flags |= ts.NodeFlags.Synthesized;
}
