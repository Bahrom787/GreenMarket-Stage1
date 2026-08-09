import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, ErrorState, Button } from '@/design-system/components';
import { fetchGroups, CatalogApiError } from '../api';
import { SearchBar } from '../components/SearchBar';
import type { ProductGroup } from '../types';

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; groups: ProductGroup[] };

const categoryArt = ['🍎', '🥬', '🥛', '🥩', '🐟', '🥖', '🍯', '🫐'];

/** Stage 1 buyer entry point: discovery, search and direct access to the catalog. */
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

  const roots = state.status === 'ready'
    ? state.groups.filter((group) => group.parent_id === null).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const popular = state.status === 'ready'
    ? [...state.groups].filter((group) => group.product_count > 0).sort((a, b) => b.product_count - a.product_count).slice(0, 5)
    : [];

  const openGroup = (groupId: number) => navigate(`/catalog?group_id=${groupId}`);

  return (
    <main className="gm-home">
      <section className="gm-home-hero">
        <div className="gm-home-hero__copy">
          <span className="gm-home-eyebrow">Продукты рядом с вами</span>
          <h1>Свежие продукты<br />от местных продавцов</h1>
          <p>Находите фермерские продукты поблизости и выбирайте лучшее предложение без лишних поездок.</p>
          <SearchBar placeholder="Что вы ищете?" onSearch={(value) => navigate(`/catalog${value ? `?search=${encodeURIComponent(value)}` : ''}`)} />
          {popular.length > 0 && (
            <div className="gm-home-popular" aria-label="Популярные запросы">
              <span>Популярное:</span>
              {popular.slice(0, 3).map((group) => (
                <button key={group.id} type="button" onClick={() => openGroup(group.id)}>{group.name}</button>
              ))}
            </div>
          )}
        </div>
        <div className="gm-home-hero__visual" aria-hidden="true">
          <div className="gm-home-hero__orb gm-home-hero__orb--one" />
          <div className="gm-home-hero__orb gm-home-hero__orb--two" />
          <div className="gm-home-basket">🥬<span>🍅</span><i>🥕</i></div>
          <div className="gm-home-note"><b>100% свежее</b><small>от продавцов рядом</small></div>
        </div>
      </section>

      <section className="gm-home-section" aria-labelledby="categories-title">
        <div className="gm-home-section__head">
          <div>
            <span className="gm-home-eyebrow">Выбирайте любимое</span>
            <h2 id="categories-title">Категории</h2>
          </div>
          <button className="gm-home-link" type="button" onClick={() => navigate('/catalog')}>Весь каталог <span>→</span></button>
        </div>

        {state.status === 'loading' && <div className="gm-home-state"><Loader size="lg" label="Загрузка категорий" /></div>}
        {state.status === 'error' && (
          <div className="gm-home-state">
            <ErrorState title="Не удалось загрузить категории" description={state.message} action={<Button onClick={load}>Повторить</Button>} />
          </div>
        )}
        {state.status === 'ready' && (
          <div className="gm-home-categories">
            {roots.map((group, index) => (
              <button key={group.id} type="button" className="gm-home-category" onClick={() => openGroup(group.id)}>
                <span className={`gm-home-category__art gm-home-category__art--${(index % 4) + 1}`}>{categoryArt[index % categoryArt.length]}</span>
                <span className="gm-home-category__name">{group.name}</span>
                <span className="gm-home-category__meta">{group.product_count || 'Смотреть'} {group.product_count ? 'товаров' : ''}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="gm-home-promise">
        <div><span>⌖</span><p><b>Продавцы рядом</b><small>Находите продукты по соседству</small></p></div>
        <div><span>♧</span><p><b>Свежий выбор</b><small>Понятный каталог без лишнего</small></p></div>
        <div><span>✓</span><p><b>Удобное сравнение</b><small>Цена и предложения в одном месте</small></p></div>
      </section>
    </main>
  );
}
