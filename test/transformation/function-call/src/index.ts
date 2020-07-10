export function foo() {
  return useBar({ name: 'foo' });
}

function useBar({ name }) {
  return name + 'bar';
}
