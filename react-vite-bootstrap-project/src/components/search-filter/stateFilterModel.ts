export type StateFilterId = 'open' | 'available';

const labels: Record<StateFilterId, string> = {
  open: 'Открытые',
  available: 'Доступные',
};

export function stateFilterLabel(id: StateFilterId) {
  return labels[id];
}
