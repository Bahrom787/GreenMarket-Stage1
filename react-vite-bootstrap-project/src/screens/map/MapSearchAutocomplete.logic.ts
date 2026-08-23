export function nextOptionIndex(current: number, count: number, key: 'ArrowDown' | 'ArrowUp') {
  if (count <= 0) return -1;
  if (key === 'ArrowDown') return current < 0 ? 0 : (current + 1) % count;
  return current <= 0 ? count - 1 : current - 1;
}
