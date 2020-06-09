import ts from 'typescript';

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
  if (before && ancestor) {
    setParent(before, ancestor);
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
  if (result && ancestor) {
    setParent(result, ancestor);
  }

  return result;
}

function setParent(node: ts.Node, ancestor: ts.Node) {
  node.parent = ancestor;
  ts.forEachChild(node, child => {
    setParent(child, node);
  });
}
