import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Text, Loader, ErrorState, Button } from '@/design-system/components';
import { Stack } from '@/layout';
import { fetchGroups, CatalogApiError } from '../api';
import { CategoryTree } from '../components/CategoryTree';
import { SearchBar } from '../components/SearchBar';
import type { ProductGroup } from '../types';

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; groups: ProductGroup[] };

/** Экран 1 (Buyer_MVP.md): строка поиска, дерево категорий, популярные категории. */
export function HomeScreen() {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  function load() {
    setState({ status: 'loading' });
    fetchGroups()
      .then((res) => setState({ status: 'ready', groups: res.groups }))
      .catch((err: unknown) => {
        const message = err instanceof CatalogApiError ? err.message : 'Не удалось загрузить категории.';
        setState({ status: 'error', message });
      });
  }

  useEffect(load, []);

  const popular = state.status === 'ready' ? [...state.groups].sort((a, b) => b.product_count - a.product_count).slice(0, 6) : [];

  return (
    <Stack gap="lg">
      <Text variant="headline" as="h1">
        GreenMarket
      </Text>

      <SearchBar
        onSearch={(value) => {
          const params = value ? `?search=${encodeURIComponent(value)}` : '';
          navigate(`/catalog${params}`);
        }}
      />

      {state.status === 'loading' && <Loader size="lg" label="Загрузка категорий" />}

      {state.status === 'error' && (
        <ErrorState title="Не удалось загрузить категории" description={state.message} action={<Button onClick={load}>Повторить</Button>} />
      )}

      {state.status === 'ready' && (
        <>
          {popular.length > 0 && (
            <section>
              <Text variant="title" as="h2">
                Популярные категории
              </Text>
              <Stack gap="xs">
                {popular.map((g) => (
                  <Button key={g.id} variant="secondary" onClick={() => navigate(`/catalog?group_id=${g.id}`)}>
                    {g.name} ({g.product_count})
                  </Button>
                ))}
              </Stack>
            </section>
          )}

          <section>
            <Text variant="title" as="h2">
              Все категории
            </Text>
            <CategoryTree groups={state.groups} onSelect={(groupId) => navigate(`/catalog?group_id=${groupId}`)} />
          </section>
        </>
      )}
    </Stack>
  );
}
