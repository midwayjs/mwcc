"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foo = void 0;
function foo() {
    return useBar.bind(this)();
}
exports.foo = foo;
function useBar() {
    return 'bar';
}
//# sourceMappingURL=index.js.map
