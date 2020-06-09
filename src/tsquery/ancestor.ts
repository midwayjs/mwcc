import ts from 'typescript';

type Kind = ts.SyntaxKind | string;

export function closestAncestor(
  node: ts.Node | undefined,
  kinds: Kind | Kind[]
): ts.Node | undefined {
  if (node == null) {
    return;
  }
  if (!Array.isArray(kinds)) {
    kinds = [kinds];
  }
  kinds = kinds.map(it => {
    if (typeof it === 'string') {
      return ts.SyntaxKind[it];
    }
    return it;
  });
  let parent = node.parent as ts.Node | undefined;
  while (parent != null) {
    node = parent;
    if (kinds.indexOf(node.kind) >= 0) {
      return node;
    }

    parent = node.parent;
  }

  return undefined;
}
