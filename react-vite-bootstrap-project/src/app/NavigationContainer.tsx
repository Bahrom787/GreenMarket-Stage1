import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { PlaceholderScreen } from '@/screens/PlaceholderScreen';
import { MapScreenView } from '@/screens/map/MapScreenView';
import { SellerListScreenView } from '@/screens/seller-list/SellerListScreenView';
import { Header, Page, Row } from '@/layout';
import '@/buyer_mvp/buyer_mvp.css';
import { HomeScreen } from '@/buyer_mvp/screens/HomeScreen';
import { CatalogScreen } from '@/buyer_mvp/screens/CatalogScreen';
import { ProductScreen } from '@/buyer_mvp/screens/ProductScreen';

const navItems = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/map', label: 'Карта' },
  { to: '/seller-list', label: 'Продавцы' },
];

const FULL_SCREEN_ROUTES = new Set(['/map', '/seller-list']);

function TopNav() {
  return (
    <Header className="gm-site-header">
      <Page style={{ padding: 0 }}>
        <Row gap="lg" align="center" style={{ height: '100%', justifyContent: 'space-between' }}>
          <NavLink to="/" className="gm-site-brand" aria-label="GreenMarket, на главную"><span>G</span> GreenMarket</NavLink>
          <nav className="gm-site-nav" aria-label="Основная навигация">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `gm-site-nav__link${isActive ? ' gm-site-nav__link--active' : ''}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <NavLink to="/profile" className="gm-site-profile" aria-label="Профиль">П</NavLink>
        </Row>
      </Page>
    </Header>
  );
}

export function NavigationContainer() {
  const location = useLocation();
  const isFullScreenRoute = FULL_SCREEN_ROUTES.has(location.pathname);

  return (
    <>
      {!isFullScreenRoute && <TopNav />}
      {isFullScreenRoute ? (
        <Routes>
          <Route path="/map" element={<MapScreenView />} />
          <Route path="/seller-list" element={<SellerListScreenView />} />
        </Routes>
      ) : (
        <Page>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/catalog" element={<CatalogScreen />} />
            <Route path="/product/:productId" element={<ProductScreen />} />
            <Route path="/cart" element={<PlaceholderScreen name="Корзина" />} />
            <Route path="/profile" element={<PlaceholderScreen name="Профиль" />} />
            <Route path="/seller/:sellerId" element={<PlaceholderScreen name="Карточка продавца" />} />
            <Route path="*" element={<PlaceholderScreen name="Страница не найдена" />} />
          </Routes>
        </Page>
      )}
    </>
  );
}
