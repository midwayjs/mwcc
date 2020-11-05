import "./log";
export { OnlyType } from "./export/type";
export { func } from "./export/func";
export { func as demoFunc } from "./export/func";
export declare type ImportType = import("./export/type").OnlyType;
