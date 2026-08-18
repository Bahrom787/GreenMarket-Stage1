import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ErrorState, Loader } from '@/design-system/components';
import { CatalogApiError, fetchGroups } from '../api';
import { SearchBar } from '../components/SearchBar';
import {
  catalogGroupPath,
  catalogSearchPath,
  categoryPresentation,
  groupsWithMoreProducts,
  productCountLabel,
  rootGroups,
} from '../homePresentation';
import type { ProductGroup } from '../types';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; groups: ProductGroup[] };

/** Stage 1 buyer entry point: discovery, search and direct access to the catalog. */
export function HomeScreen() {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  function load() {
    setState({ status: 'loading' });
    fetchGroups()
      .then((res) => setState({ status: 'ready', groups: res.groups }))
      .catch((err: unknown) => {
        const message =
          err instanceof CatalogApiError ? err.message : 'Не удалось загрузить категории.';
        setState({ status: 'error', message });
      });
  }

  useEffect(load, []);

  const roots = state.status === 'ready' ? rootGroups(state.groups) : [];
  const moreProducts = state.status === 'ready' ? groupsWithMoreProducts(state.groups) : [];

  const openGroup = (groupId: number) => navigate(catalogGroupPath(groupId));

  return (
    <main className="gm-home">
      <section className="gm-home-hero">
        <div className="gm-home-hero__copy">
          <span className="gm-home-eyebrow">Каталог Green Board</span>
          <h1>Продукты в удобном каталоге</h1>
          <p>
            Ищите товары по названию или переходите в нужную категорию. Экран использует только
            данные текущего Catalog API и не добавляет неподтвержденные обещания.
          </p>
          <SearchBar
            placeholder="Что вы ищете?"
            onSearch={(value) => navigate(catalogSearchPath(value))}
          />
          {moreProducts.length > 0 && (
            <div className="gm-home-popular" aria-label="Категории с большим количеством товаров">
              <span>Больше товаров:</span>
              {moreProducts.slice(0, 3).map((group) => (
                <button key={group.id} type="button" onClick={() => openGroup(group.id)}>
                  {group.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="gm-home-hero__visual" aria-hidden="true">
          <div className="gm-home-hero__orb gm-home-hero__orb--one" />
          <div className="gm-home-hero__orb gm-home-hero__orb--two" />
          <div className="gm-home-basket">
            🥬<span>🍅</span>
            <i>🥕</i>
          </div>
          <div className="gm-home-note">
            <b>Категории API</b>
            <small>поиск и переходы в каталог</small>
          </div>
        </div>
      </section>

      <section className="gm-home-section" aria-labelledby="categories-title">
        <div className="gm-home-section__head">
          <div>
            <span className="gm-home-eyebrow">Выбирайте раздел</span>
            <h2 id="categories-title">Категории</h2>
          </div>
          <button className="gm-home-link" type="button" onClick={() => navigate('/')}>
            Весь каталог <span>→</span>
          </button>
        </div>

        {state.status === 'loading' && (
          <div className="gm-home-state">
            <Loader size="lg" label="Загрузка категорий" />
          </div>
        )}
        {state.status === 'error' && (
          <div className="gm-home-state">
            <ErrorState
              title="Не удалось загрузить категории"
              description={state.message}
              action={<Button onClick={load}>Повторить</Button>}
            />
          </div>
        )}
        {state.status === 'ready' &&
          (roots.length > 0 ? (
            <div className="gm-home-categories">
              {roots.map((group) => {
                const presentation = categoryPresentation(group);
                return (
                  <button
                    key={group.id}
                    type="button"
                    className="gm-home-category"
                    onClick={() => openGroup(group.id)}
                  >
                    <span
                      className={`gm-home-category__art gm-home-category__art--${presentation.tone}`}
                      aria-hidden="true"
                    >
                      {presentation.icon}
                    </span>
                    <span className="gm-home-category__name">{group.name}</span>
                    <span className="gm-home-category__meta">
                      {group.product_count > 0
                        ? productCountLabel(group.product_count)
                        : 'Смотреть категорию'}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="gm-home-state" role="status">
              <p>Категории пока не добавлены. Можно воспользоваться поиском выше.</p>
            </div>
          ))}
      </section>

      <section className="gm-home-promise">
        <div>
          <span>⌕</span>
          <p>
            <b>Поиск по каталогу</b>
            <small>Запрос передается в Catalog API через параметр search</small>
          </p>
        </div>
        <div>
          <span>§</span>
          <p>
            <b>Разделы товаров</b>
            <small>Корневые категории приходят из ProductGroup</small>
          </p>
        </div>
        <div>
          <span>✓</span>
          <p>
            <b>Сохранены контракты</b>
            <small>Переходы используют существующие маршруты каталога</small>
          </p>
        </div>
      </section>
    </main>
  );
}
