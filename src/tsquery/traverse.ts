import ts = require('typescript')

export interface IVisitor {
  enter?: (node: ts.Node, parent: ts.Node | undefined) => void;
  leave?: (node: ts.Node) => void;
}

export function traverse (node: ts.Node | undefined, visitor: IVisitor, ancestor?: ts.Node) {
  if (node == null) {
    return
  }
  visitor.enter?.(node, ancestor)
  ts.forEachChild(node, (child) => {
    traverse(child, visitor, node)
  })
  visitor.leave?.(node)
}
