"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useQuz = exports.useBar = exports.foo = void 0;
function foo() {
    return exports.useBar.bind(this)({ name: exports.useQuz.bind(this)() });
}
exports.foo = foo;
exports.useBar = function ({ name }) {
    return name + 'bar';
};
exports.useQuz = function () {
    return 'quz';
};
//# sourceMappingURL=index.js.map
