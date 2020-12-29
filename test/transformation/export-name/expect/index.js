"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useQuz = exports.useBar = exports.foo = void 0;
function foo() {
    return exports.useBar.bind(this)({ name: exports.useQuz.bind(this)() });
}
exports.foo = foo;
const useBar = function ({ name }) {
    return name + 'bar';
};
exports.useBar = useBar;
const useQuz = function () {
    return 'quz';
};
exports.useQuz = useQuz;
//# sourceMappingURL=index.js.map
