#!/usr/bin/env node

import { compileInProject } from './index';

(async () => {
  const summary = await compileInProject(process.cwd(), 'dist');
  if (summary.diagnostics.length > 0) {
    process.exitCode = 1;
  }
})();
