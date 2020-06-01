import ts, { CompilerHost } from 'typescript';
import {
  createTransformationContext,
  TransformationContext,
} from './transformation-context';
import { chainBundle } from '../util';
import { visitMatch, parse } from '../tsquery/query';
import { PluginModule, ConditionalTransformer } from './type';
import { MwccConfig } from '../type';

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
            (it as unknown) as ConditionalTransformer,
            transformCtx
          )
        );
      }
      return chainBundle(it);
    });
    return chainTransformers([...pipeline, contextPostProcessor(transformCtx)]);
  };

  function conditionalTransform(
    map: ConditionalTransformer,
    ctx: TransformationContext
  ): ts.Transformer<ts.SourceFile> {
    return (node: ts.SourceFile) => {
      const result = Object.keys(map).reduce((sourceFile, pattern) => {
        return visitMatch(sourceFile, parse(pattern), map[pattern], ctx);
      }, node);
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
  if (typeof config.features?.tsc !== 'object') {
    return [];
  }
  if (!Array.isArray(config.features.tsc.transformers)) {
    return [];
  }
  return config.features.tsc.transformers.map(({ name, module }) => {
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

function contextPostProcessor(
  ctx: TransformationContext
): (node: ts.SourceFile) => ts.SourceFile {
  return (node: ts.SourceFile) => {
    const decls = ctx.additionalImportDeclarations;
    ctx.additionalImportDeclarations = [];
    return ts.updateSourceFileNode(
      node,
      [...decls, ...node.statements],
      node.isDeclarationFile,
      node.referencedFiles,
      node.typeReferenceDirectives,
      node.hasNoDefaultLib,
      node.libReferenceDirectives
    );
  };
}
