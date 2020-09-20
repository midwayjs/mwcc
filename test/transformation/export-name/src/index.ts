export function foo() {
  return useBar({ name: useQuz() });
}

export const useBar = function ({ name }) {
  return name + 'bar';
}

export const useQuz = () => {
  return 'quz';
};
