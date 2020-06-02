import ts from 'typescript';
import { assert } from '../../dist/util';

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
];
