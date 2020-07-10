import ts from 'typescript';
import { assert } from '../../src/util';
import { template, TransformationContext } from '../../src';

export default [
  {
    name: 'import-redirect',
    projectRoot: 'test/transformation/import-module',
    transformers: [
      {
        name: require.resolve('./import-redirect'),
      },
    ],
    assertOutputFiles: ['index.js'],
  },
  {
    name: 'additional-import',
    projectRoot: 'test/transformation/additional-import',
    transformers: [
      {
        name: require.resolve('./additional-import'),
      },
    ],
    assertOutputFiles: ['index.js', 'foo.js'],
  },
  {
    name: 'decorators',
    projectRoot: 'test/transformation/decorators',
    transformers: [
      {
        name: require.resolve('./decorators'),
      },
    ],
    assertOutputFiles: ['index.js'],
  },
  {
    name: 'unresolved-symbol',
    projectRoot: 'test/transformation/unresolved-symbol',
    transformers: [
      {
        name: require.resolve('./unresolved-symbol'),
      },
    ],
    assertOutputFiles: ['index.js'],
  },
  {
    name: 'template',
    projectRoot: 'test/transformation/function-call',
    transformers: [
      {
        name: require.resolve('./template'),
      },
    ],
    assertOutputFiles: ['index.js'],
  },
  {
    name: 'resolve-imported-names',
    projectRoot: 'test/transformation/function-call',
    transformers: [
      {
        name: 'assert',
        module: {
          transform: (ctx: TransformationContext) => {
            return {
              Identifier: (node: ts.Node) => {
                if (!ts.isIdentifier(node)) {
                  throw 'foo';
                }
                if (node.escapedText === 'name') {
                  ctx.resolveImportedNames(node);
                }
                return node;
              },
            };
          },
        },
      },
    ],
    assertOutputFiles: [],
  },
  {
    name: 'call-expression-transform',
    projectRoot: 'test/transformation/function-call',
    transformers: [
      {
        name: require.resolve('./use-bind'),
      },
    ],
    assertOutputFiles: ['index.js'],
  },
  {
    name: 'call-expression-transform: node.parent should be properly assigned',
    projectRoot: 'test/transformation/function-call',
    transformers: [
      {
        name: require.resolve('./use-bind'),
      },
      {
        name: 'assert',
        module: {
          transform: () => {
            return {
              SourceFile: (node: ts.Node) => {
                // Validate 'CallExpression PropertyAccess' has correct parent set.
                validateSourceFile(node);
                return node;

                function validateSourceFile(node) {
                  ts.forEachChild(node, child => {
                    assert(
                      child
                        .getSourceFile()
                        .fileName.includes('test/transformation/function-call')
                    );
                    validateSourceFile(child);
                  });
                }
              },
            };
          },
        },
      },
    ],
    assertOutputFiles: ['index.js'],
  },
  {
    name: 'ctx-resolve-declarations',
    projectRoot: 'test/transformation/transform-exports',
    transformers: [
      {
        name: 'it',
        module: {
          transform: (ctx: TransformationContext) => {
            return {
              ExportAssignment: (node: ts.Node) => {
                // Update SourceFile
                const expr = (node as ts.ExportAssignment)
                  .expression as ts.ArrowFunction;
                return ts.createFunctionDeclaration(
                  expr.decorators,
                  expr.modifiers,
                  expr.asteriskToken,
                  ts.createIdentifier('$default'),
                  expr.typeParameters,
                  expr.parameters,
                  expr.type,
                  expr.body as ts.Block
                );
              },
            };
          },
        },
      },
      {
        name: 'it',
        module: {
          transform: (ctx: TransformationContext) => {
            return {
              Identifier: (node: ts.Node) => {
                // Insert no symbol identifiers
                const id = node as ts.Identifier;
                if (id.text === 'demo') {
                  return (template(`${(node as ts.Identifier).text}`)(
                    {}
                  )[0] as ts.ExpressionStatement).expression;
                }
                return node;
              },
            };
          },
        },
      },
      {
        name: 'it',
        module: {
          transform: (ctx: TransformationContext) => {
            return {
              Identifier: (node: ts.Node) => {
                // Should not crash
                assert(ctx.resolveDeclarations(node));
                return node;
              },
            };
          },
        },
      },
    ],
  },
];
