import { NavLink } from 'react-router-dom';
import { Text } from '@/design-system/components';
import { Stack } from '@/layout';

export function GreenBoardScreen() {
  return (
    <main className="gm-green-board" data-testid="green-board-screen">
      <Stack gap="xl">
        <Stack gap="md" className="gm-green-board__intro">
          <Text variant="headline" as="h1">
            Green Board
          </Text>
          <Text variant="body" tone="secondary">
            Green Board объединяет предложения местных продавцов в общем каталоге. Покупатель может найти товар,
            сравнить доступные предложения и перейти к конкретному продавцу.
          </Text>
          <Text variant="body" tone="secondary">
            У каждого продавца есть отдельный контекст магазина: в нём каталог и товары относятся только к выбранному
            продавцу.
          </Text>
        </Stack>

        <NavLink to="/" className="gm-button gm-button--primary gm-focusable gm-green-board__catalog-link">
          Перейти в каталог
        </NavLink>
      </Stack>
    </main>
  );
}
