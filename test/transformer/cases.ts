export default [
  {
    name: 'import-redirect',
    projectRoot: 'test/transformation/import-module',
    hintConfig: {
      features: {
        tsc: {
          transformers: [
            {
              name: require.resolve('./import-redirect'),
            },
          ],
        },
      },
    },
    assertOutputFiles: ['index.js'],
  },
  {
    name: 'template',
    projectRoot: 'test/transformation/function-call',
    hintConfig: {
      features: {
        tsc: {
          transformers: [
            {
              name: require.resolve('./template'),
            },
          ],
        },
      },
    },
    assertOutputFiles: ['index.js'],
  },
  {
    name: 'call-expression-transform',
    projectRoot: 'test/transformation/function-call',
    hintConfig: {
      features: {
        tsc: {
          transformers: [
            {
              name: require.resolve('./use-bind'),
            },
          ],
        },
      },
    },
    assertOutputFiles: ['index.js'],
  },
];
