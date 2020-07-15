import ts from 'typescript';

export const getSourceFileText = (nodeOrigin: ts.Node) => {
  let node = nodeOrigin;
  while (!ts.isSourceFile(node) && node.parent) {
    node = node.parent;
  }
  return node.getText();
};


export const getPosition = (code: string, pos: number) => {
  try {
    const codeArr: string[] = code.substr(0, pos).split('\n');
    const ln = codeArr.length - 1;
    return {
      ln,
      col: codeArr[ln]?.length || 0,
      index: pos,
    };
  } catch (e) {
    return { ln: 0, col: 0, index: 0 };
  }
};