import { Chip, Text } from '@/design-system/components';
import { Row, Stack } from '@/layout';
import { stateFilterLabel, type StateFilterId } from './stateFilterModel';

export function StateFilter({
  selected,
  onToggle,
  note,
  testId = 'state-filter',
}: {
  selected: StateFilterId[];
  onToggle: (id: StateFilterId) => void;
  note?: string;
  testId?: string;
}) {
  return (
    <Stack gap="xs" data-testid={testId}>
      <Row gap="sm" wrap>
        {(['open', 'available'] as const).map((id) => (
          <Chip key={id} selected={selected.includes(id)} onClick={() => onToggle(id)} data-testid={`${testId}-${id}`}>
            {stateFilterLabel(id)}
          </Chip>
        ))}
      </Row>
      {note && (
        <Text variant="caption" tone="secondary">
          {note}
        </Text>
      )}
    </Stack>
  );
}
