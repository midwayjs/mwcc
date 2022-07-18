import ts, { CompilerHost } from 'typescript';
import {
  createTransformationContext,
  TransformationContext,
} from './transformation-context';
import { chainBundle } from '../util';
import { visitMatch, parse } from '../tsquery/query';
import { PluginModule, ConditionalTransformer } from './type';
import { MwccConfig, TransformerPlugin } from '../type';

export default function createTransformer(
  host: CompilerHost,
  checker: ts.TypeChecker,
  config: MwccConfig
): ts.TransformerFactory<ts.SourceFile> {
  const transformers = loadPlugin(config);
  return ctx => {
    const transformCtx = createTransformationContext(ctx, checker);
    const pipeline = transformers.map(transformer => {
      const it = transformer.transform(transformCtx);
      if (typeof it === 'object') {
        return chainBundle(
          conditionalTransform(
            it as unknown as ConditionalTransformer,
            transformCtx
          )
        );
      }
      return chainBundle(it);
    });
    return chainTransformers(pipeline);
  };

  function conditionalTransform(
    map: ConditionalTransformer,
    ctx: TransformationContext
  ): ts.Transformer<ts.SourceFile> {
    return (node: ts.SourceFile) => {
      let result = Object.keys(map).reduce((sourceFile, pattern) => {
        return visitMatch(sourceFile, parse(pattern), map[pattern], ctx);
      }, node);
      const additionalHelperStmts = ctx.swapAdditionalHelperStatements();
      if (additionalHelperStmts.length) {
        result = ts.updateSourceFileNode(
          result,
          [...additionalHelperStmts, ...result.statements],
          result.isDeclarationFile,
          result.referencedFiles,
          result.typeReferenceDirectives,
          result.hasNoDefaultLib,
          result.libReferenceDirectives
        );
      }
      // FIXME: Updated SourceFile missing symbol property may crash typescript functions afterwards.
      (result as any).symbol = (result as any).symbol ?? {};
      return result;
    };
  }
}

function loadTransformer(name: string) {
  const mod = require(name);
  if (mod.default) {
    return mod.default as PluginModule;
  }
  return mod as PluginModule;
}

function loadPlugin(config: MwccConfig) {
  const tsc = config.features?.tsc;
  if (tsc === false) {
    return [];
  }

  const transformers: TransformerPlugin[] = [
    {
      name: require.resolve('../feature/tsconfig-paths'),
    },
  ];

  if (typeof tsc === 'object' && Array.isArray(tsc.transformers)) {
    transformers.push(...tsc.transformers);
  }

  return transformers.map(({ name, module }) => {
    if (module) {
      return module;
    }
    return loadTransformer(name);
  });
}

function chainTransformers(
  transformers: ts.Transformer<ts.SourceFile>[]
): ts.Transformer<ts.SourceFile> {
  return node => {
    return transformers.reduce((node, curr) => {
      return curr(node);
    }, node);
  };
}
