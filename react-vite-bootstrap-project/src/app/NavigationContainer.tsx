import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { PlaceholderScreen } from '@/screens/PlaceholderScreen';
import { MapScreenView } from '@/screens/map/MapScreenView';
import { Header, Page, Row } from '@/layout';
import { Text } from '@/design-system/components';
import '@/buyer_mvp/buyer_mvp.css';
import { HomeScreen } from '@/buyer_mvp/screens/HomeScreen';
import { CatalogScreen } from '@/buyer_mvp/screens/CatalogScreen';
import { ProductScreen } from '@/buyer_mvp/screens/ProductScreen';

const navItems = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/map', label: 'Карта' },
  { to: '/cart', label: 'Корзина' },
  { to: '/profile', label: 'Профиль' },
];

function TopNav() {
  return (
    <Header>
      <Page style={{ padding: 0 }}>
        <Row gap="lg" align="center" style={{ height: '100%' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                textDecoration: 'none',
                opacity: isActive ? 1 : 0.7,
              })}
            >
              <Text variant="bodyStrong" as="span">
                {item.label}
              </Text>
            </NavLink>
          ))}
        </Row>
      </Page>
    </Header>
  );
}

/**
 * Stage 1 routing scaffold, composed from the Design System's Layout
 * primitives. Map (IMP-003.1) is the first fully real screen — it defines
 * its own Header/FABs per its own UX spec, so it deliberately skips the
 * shared TopNav/Page chrome used by the remaining placeholders.
 */
export function NavigationContainer() {
  const location = useLocation();
  const isMapRoute = location.pathname === '/map';

  return (
    <>
      {!isMapRoute && <TopNav />}
      {isMapRoute ? (
        <Routes>
          <Route path="/map" element={<MapScreenView />} />
        </Routes>
      ) : (
        <Page>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/catalog" element={<CatalogScreen />} />
            <Route path="/product/:productId" element={<ProductScreen />} />
            <Route path="/cart" element={<PlaceholderScreen name="Корзина" />} />
            <Route path="/profile" element={<PlaceholderScreen name="Профиль" />} />
            <Route path="/seller-list" element={<PlaceholderScreen name="Список продавцов" />} />
            <Route path="/seller/:sellerId" element={<PlaceholderScreen name="Карточка продавца" />} />
            <Route path="*" element={<PlaceholderScreen name="Страница не найдена" />} />
          </Routes>
        </Page>
      )}
    </>
  );
}
