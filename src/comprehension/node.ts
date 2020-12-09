import ts from 'typescript';
import { getSourceFileText, getCodePositionInfo, toUnix } from '../util';
import { AnalyzePositoin } from '../type';
import { formatParams } from './params';

interface IAnalyzeNodeInfo {
  type: string;
  name: string;
  position: AnalyzePositoin;
  classInfo?: {
    extends?: string;
    properties: string[];
  };
}

export const geNodeInfo = (node: ts.Node, classInfo): IAnalyzeNodeInfo => {
  if (ts.isMethodDeclaration(node)) {
    const classBaseInfo = getBaseInfo(node.parent);
    const classDetail = classInfo[classBaseInfo.id];
    const name = (node as any)?.name?.escapedText || '';
    const memberInfo = classDetail?.nodeInfo?.member?.[name];
    if (memberInfo) {
      return memberInfo;
    }
  }
  const baseInfo = getBaseInfo(node);
  if (ts.isClassDeclaration(node)) {
    return classInfo[baseInfo.id] || baseInfo;
  }
  return baseInfo;
};

export const getExportType = (node: ts.Node): string => {
  const isExport = node.modifiers?.find((modifier: ts.Modifier) => {
    return modifier.kind === ts.SyntaxKind.ExportKeyword;
  });
  const isDefault =
    isExport &&
    node.modifiers?.find((modifier: ts.Modifier) => {
      return modifier.kind === ts.SyntaxKind.DefaultKeyword;
    });
  return isExport ? (isDefault ? 'default' : 'export') : 'not';
};

const getNodePosition = (node: ts.Node) => {
  const code = getSourceFileText(node);
  return {
    range: {
      start: node.pos,
      end: node.end,
    },
    start: getCodePositionInfo(code, node.pos),
    end: getCodePositionInfo(code, node.end),
  };
};

const getBaseInfo = (node: ts.Node) => {
  let { fileName }: ts.SourceFile = node.getSourceFile();
  fileName = toUnix(fileName);
  let name = (node as any)?.name?.escapedText || '';
  const position = getNodePosition(node);
  const id = `${fileName.replace(/^.*?src\//, '')}#${name}#${
    position.range.start
  },${position.range.end}`;
  let type;
  if (ts.isClassDeclaration(node)) {
    type = 'class';
  } else if (ts.isMethodDeclaration(node)) {
    type = 'method';
  } else if (ts.isConstructorDeclaration(node)) {
    type = 'constructor';
    name = 'constructor';
  } else if (ts.isPropertyDeclaration(node)) {
    type = 'property';
  }
  return {
    type,
    id,
    fileName,
    name: name,
    position,
  };
};

export const getClassInfo = (classItem: ts.ClassDeclaration) => {
  const baseInfo = getBaseInfo(classItem);
  const classInfo: any = {
    exportType: getExportType(classItem),
    member: {},
  };
  if (classItem.heritageClauses && classItem.heritageClauses.length > 0) {
    const name = classItem.heritageClauses[0].types[0].expression.getText();
    classInfo.extends = {
      name,
    };
  }
  classItem.members.forEach(member => {
    const memberInfo = getBaseInfo(member);
    if (memberInfo.type === 'method') {
      const parameters = (member as any)?.parameters;
      const params = parameters ? formatParams(parameters) : [];
      classInfo.member[memberInfo.name] = {
        ...memberInfo,
        params,
      };
      return;
    }

    classInfo.member[memberInfo.name] = memberInfo;
  });
  return {
    ...baseInfo,
    nodeInfo: classInfo,
  };
};
