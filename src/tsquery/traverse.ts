import ts from 'typescript';
import { Mutable } from '../util';

export interface Traverser {
  enter?: (node: ts.Node, parent: ts.Node | undefined) => void;
  leave?: (node: ts.Node) => void;
}

export interface Visitor {
  enter?: (node: ts.Node, parent: ts.Node | undefined) => ts.Node | undefined;
  leave?: (node: ts.Node) => ts.Node | undefined;
}

export function traverse(
  node: ts.Node | undefined,
  visitor: Traverser,
  ancestor?: ts.Node
) {
  if (node == null) {
    return;
  }
  visitor.enter?.(node, ancestor);
  ts.forEachChild(node, child => {
    traverse(child, visitor, node);
  });
  visitor.leave?.(node);
}

export function visit<T extends ts.Node>(
  node: T,
  visitor: Visitor,
  ctx: ts.TransformationContext,
  ancestor?: ts.Node
) {
  const before = visitor.enter?.(node, ancestor);
  // this `node` and its children may be a synthetic node that doesn't have a `parent` set.
  if (before && before.parent == null && ancestor) {
    setParent(before, node.parent);
  }
  if (before) {
    /**
     * transformer may fall into infinite loop if revisit their result nodes.
     */
    return before;
  }

  let result = ts.visitEachChild(
    node,
    child => {
      return visit(child, visitor, ctx, node);
    },
    ctx
  );
  result = visitor.leave?.(node) ?? result;
  // this `node` and its children may be a synthetic node that doesn't have a `parent` set.
  if (result && result.parent == null && ancestor) {
    setParent(result, node.parent);
  }

  return result;
}
type MutableParentNode = Mutable<ts.Node, 'parent'>;

function setParent(_node: ts.Node, ancestor: ts.Node) {
  const node = _node as MutableParentNode;
  node.parent = ancestor;
  ts.forEachChild(node, child => {
    setParent(child, node);
  });
}
