import type { TransformationContext } from './transformation-context';
import ts from 'typescript';

export { TransformationContext };

export interface TransformerPluginModule {
  transform(ctx: TransformationContext): ConditionalTransformer;
}

export interface ConditionalTransformer {
  [key: string]: (node: ts.Node) => ts.Node;
}

export interface PluginModule {
  transform(ctx: TransformationContext): ConditionalTransformer;
}
