import { Content, Stack } from '@/layout';
import { Text } from '@/design-system/components';

interface PlaceholderScreenProps {
  name: string;
}

export function PlaceholderScreen({ name }: PlaceholderScreenProps) {
  return (
    <Content>
      <Stack gap="sm">
        <Text variant="displaySm" as="h1">
          {name}
        </Text>
        <Text tone="secondary">Экран-заглушка, построенный на Design System. Реализация UI начнётся на Этапе 3.</Text>
      </Stack>
    </Content>
  );
}
