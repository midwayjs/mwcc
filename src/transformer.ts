import ts, { CompilerHost } from 'typescript';
import {
  createTransformationContext,
  TransformationContext,
} from './transformation-context';
import { chainBundle } from './util';
import { visitMatch, parse } from './tsquery/query';
import { MwccConfig } from './iface';

export interface PluginModule {
  transform(ctx: TransformationContext): ConditionalTransformer;
}

interface ConditionalTransformer {
  [key: string]: (node: ts.Node) => ts.Node;
}

export default function createTransformer(
  host: CompilerHost,
  config: MwccConfig
): ts.TransformerFactory<ts.SourceFile> {
  const transformers =
    typeof config.features?.tsc === 'object'
      ? config.features.tsc.transformers.map(({ name }) =>
          loadTransformer(name)
        )
      : [];
  return ctx => {
    const pipeline = transformers.map(transformer => {
      const transformCtx = createTransformationContext(ctx);
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
    return chainTransformers(pipeline);
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

function chainTransformers(
  transformers: ts.Transformer<ts.SourceFile>[]
): ts.Transformer<ts.SourceFile> {
  return node => {
    return transformers.reduce((node, curr) => {
      return curr(node);
    }, node);
  };
}
