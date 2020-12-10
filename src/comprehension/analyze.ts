import ts from 'typescript';
import { MwccConfig, AnalyzeResult, AnalyzeDecoratorInfo } from '../type';
import { CompilerHost } from '../compiler-host';
import { Program } from '../program';
import { query } from '../tsquery';
import { getExpressionBaseInfo } from './expression';
import { getNodeInfo, getClassInfo } from './node';
import { toUnix } from '../util';

interface IAnalyzeOptions {
  program?: Program;
  compilerHost?: CompilerHost;
  projectDir?: string;
  mwccConfig?: MwccConfig;
  decoratorLowerCase?: boolean;
}
export class Analyzer {
  private program: Program;
  private analyzeResult: AnalyzeResult = {
    decorator: {},
    class: {},
  };
  private options: IAnalyzeOptions;
  private checker: ts.TypeChecker;
  private projectDir: string;

  constructor(options: IAnalyzeOptions) {
    this.options = options || {};
    this.program = this.initProgram(options);
    this.projectDir = toUnix(this.program.context.projectDir);
    this.checker = this.program.getTypeChecker();
  }

  public analyze() {
    this.analyzeResult.class = this.getClasses();
    this.analyzeResult.decorator = this.getDecorators();
    return this.analyzeResult;
  }

  public getProgram() {
    return this.program;
  }

  // program initialize
  private initProgram(options: IAnalyzeOptions) {
    const { program, compilerHost, projectDir, mwccConfig } = options;
    if (program) {
      return program;
    } else if (compilerHost) {
      return new Program(compilerHost);
    } else {
      return new Program(
        new CompilerHost(projectDir || process.cwd(), mwccConfig || {})
      );
    }
  }

  private getClasses() {
    const classMap = {};
    for (const sourceFile of this.program.getSourceFiles()) {
      const classes = query(
        sourceFile,
        'ClassDeclaration'
      ) as ts.ClassDeclaration[];
      classes.forEach(classItem => {
        const classInfo = this.getClassInfo(classItem);
        if (!classInfo) {
          return;
        }
        classMap[classInfo.id] = classInfo;
      });
    }
    return classMap;
  }

  private getDecorators() {
    const decoratorsMap = {};
    const decoratorList: any = [];
    for (const sourceFile of this.program.getSourceFiles()) {
      const decorators = query(
        sourceFile,
        'ClassDeclaration Decorator'
      ) as ts.Decorator[];
      decorators.forEach((decorator: ts.Decorator) => {
        const decoratorInfo:
          | AnalyzeDecoratorInfo
          | undefined = this.analyzeDecorator(decorator);
        if (decoratorInfo) {
          decoratorList.push(decoratorInfo);
          this.assignDecorators(decoratorsMap, decoratorInfo);
        }
      });
    }

    for (const decorator of decoratorList) {
      if (decorator.target.type !== 'class') {
        const parent = this.findParent(decoratorList, decorator);
        if (parent) {
          if (!parent.childDecorators) {
            parent.childDecorators = {};
          }
          this.assignDecorators(parent.childDecorators, decorator);
        }
      }
    }
    return decoratorsMap;
  }

  // find the class where the decorator is decorating the target
  private findParent(decorators, find) {
    for (const decorator of decorators) {
      if (
        decorator.target.type === 'class' &&
        decorator.sourceFile === find.sourceFile &&
        decorator.target.position.range.start <=
          find.target.position.range.start &&
        decorator.target.position.range.end >= find.target.position.range.end
      ) {
        return decorator;
      }
    }
  }

  // get class info
  private getClassInfo(classItem: ts.ClassDeclaration) {
    const sourceFile: ts.SourceFile = classItem.getSourceFile();
    if (sourceFile.fileName.indexOf(this.projectDir) === -1) {
      return;
    }
    return getClassInfo(classItem);
  }

  private analyzeDecorator(decorator: ts.Decorator) {
    if (!ts.isCallExpression(decorator.expression)) {
      return;
    }
    const sourceFile: ts.SourceFile = decorator.getSourceFile();
    const sourceInfo = {
      sourceFile: sourceFile.fileName,
    };
    const expressionInfo = getExpressionBaseInfo(decorator.expression);
    if (!expressionInfo) {
      return;
    }
    let name = expressionInfo.expressionName;
    if (this.options.decoratorLowerCase) {
      name = name.toLowerCase();
    }
    const decoratorInfo: AnalyzeDecoratorInfo = {
      name,
      sourceFile: sourceInfo.sourceFile,
      params: expressionInfo.params,
      position: expressionInfo.position,
      target: getNodeInfo(decorator.parent, this.analyzeResult.class),
    };
    return decoratorInfo;
  }

  private assignDecorators(target, source) {
    if (!source || !target) {
      return;
    }
    const decoratorName = source.name;
    if (!target[decoratorName]) {
      target[decoratorName] = [];
    }
    target[decoratorName].push(source);
  }
}
