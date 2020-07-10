"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foo = void 0;
function foo() {
    return useBar.bind(this)({ name: 'foo' });
}
exports.foo = foo;
function useBar({ name }) {
    return name + 'bar';
}
//# sourceMappingURL=index.js.map
