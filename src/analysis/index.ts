import ts from 'typescript';
import { MwccConfig } from '../type';
import { CompilerHost} from '../compiler-host';
import { Program} from '../program';
import { query } from '../tsquery';
import { getExpressionBaseInfo } from './expression';
import { geNodeInfo } from './node';

interface IAnalysisOptions {
  program?: Program;
  compilerHost?: CompilerHost;
  projectDir?: string;
  mwccConfig?: MwccConfig;
  decoratorLowerCase?: boolean;
}
export class TsAnalysis {

  private program: Program;
  private analysisResult = {};
  private options: IAnalysisOptions;
  private checker: ts.TypeChecker;

  constructor(options: IAnalysisOptions) {
    this.options = options || {};
    this.program = this.initProgram(options);
    this.checker = this.program.getTypeChecker();
  }

  public async analysis() {
    this.analysisResult['decorator'] = await this.getDecorators();
  }

  public getResult() {
    return this.analysisResult;
  }

  public findParent(decorators, find) {
    for(const decorator of decorators) {
      if (
        decorator.target.type === 'class' &&
        decorator.sourceFile === find.sourceFile &&
        decorator.target.position.range.start <= find.target.position.range.start &&
        decorator.target.position.range.end >= find.target.position.range.end
      ) {
        return decorator;
      }
    }
  }

  public getProgram() {
    return this.program;
  }

  // program initialize
  private initProgram(options: IAnalysisOptions) {
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

  private getDecorators() {
    const decoratorsMap = {};
    const decoratorList: any = [];
    for (const sourceFile of this.program.getSourceFiles()) {
      const decorators = query(
        sourceFile,
        'ClassDeclaration Decorator'
      ) as ts.Decorator[];
      decorators.forEach((decorator: ts.Decorator) => {
        const decoratorInfo = this.analysisDecorator(decorator);
        if (decoratorInfo) {
          decoratorList.push(decoratorInfo);
          this.assignDecorators(decoratorsMap, decoratorInfo);
        }
      });
    }

    for(const decorator of decoratorList) {
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

  private analysisDecorator(decorator: ts.Decorator) {
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
    const decoratorInfo = {
      name,
      sourceFile: sourceInfo.sourceFile,
      params: expressionInfo.params,
      position: expressionInfo.position,
      target: geNodeInfo(decorator.parent, this.checker)
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


export const tsAnalysisInstance = async (options: IAnalysisOptions) => {
  const analysisInstance = new TsAnalysis(options);
  await analysisInstance.analysis();  
  return analysisInstance.getResult();
};
