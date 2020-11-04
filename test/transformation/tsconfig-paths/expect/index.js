"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./util/index");
const foo_1 = require("./foo");
const bar_1 = require("./util/bar");
require("./log");
const str = require("./util/string");
var func_1 = require("./export/func");
Object.defineProperty(exports, "func", { enumerable: true, get: function () { return func_1.func; } });
var func_2 = require("./export/func");
Object.defineProperty(exports, "demoFunc", { enumerable: true, get: function () { return func_2.func; } });
console.log(foo_1.default, bar_1.default, index_1.default, str);
async function dynamic() {
    const loader = await Promise.resolve().then(() => require("./async/loader"));
    const strUtil = require("./util/string");
    console.log(loader, strUtil);
}
//# sourceMappingURL=index.js.map
