import { useMemo } from 'react';
import { Navigate, Routes, Route, NavLink, useLocation, useParams } from 'react-router-dom';
import { PlaceholderScreen } from '@/screens/PlaceholderScreen';
import { MapScreenView } from '@/screens/map/MapScreenView';
import { SellerListScreenView } from '@/screens/seller-list/SellerListScreenView';
import { Header, Page, Row } from '@/layout';
import '@/buyer_mvp/buyer_mvp.css';
import { CatalogScreen } from '@/buyer_mvp/screens/CatalogScreen';
import { ProductScreen } from '@/buyer_mvp/screens/ProductScreen';
import { StoreHomeScreen } from '@/buyer_mvp/screens/StoreHomeScreen';
import { globalCatalogContext, storeCatalogContext } from '@/buyer_mvp/catalogContext';

const navItems = [
  { to: '/', label: 'Каталог' },
  { to: '/map', label: 'Карта' },
  { to: '/seller-list', label: 'Продавцы' },
];

const FULL_SCREEN_ROUTES = new Set(['/map', '/seller-list']);

function LegacyCatalogRedirect() {
  const location = useLocation();
  return <Navigate to={`/${location.search}`} replace />;
}

function StoreCatalogRoute() {
  const { storeId } = useParams<{ storeId: string }>();
  const context = useMemo(() => storeCatalogContext(storeId ?? ''), [storeId]);
  return <CatalogScreen context={context} />;
}

function StoreProductRoute() {
  const { storeId } = useParams<{ storeId: string }>();
  const context = useMemo(() => storeCatalogContext(storeId ?? ''), [storeId]);
  return <ProductScreen context={context} />;
}

function TopNav() {
  return (
    <Header className="gm-site-header">
      <Page style={{ padding: 0 }}>
        <Row gap="lg" align="center" style={{ height: '100%', justifyContent: 'space-between' }}>
          <NavLink to="/" className="gm-site-brand" aria-label="Green Board, на главную"><span>G</span> Green Board</NavLink>
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
            <Route path="/" element={<CatalogScreen context={globalCatalogContext} />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/catalog" element={<LegacyCatalogRedirect />} />
            <Route path="/product/:productId" element={<ProductScreen context={globalCatalogContext} />} />
            <Route path="/store/:storeId" element={<StoreHomeScreen />} />
            <Route path="/store/:storeId/catalog" element={<StoreCatalogRoute />} />
            <Route path="/store/:storeId/product/:productId" element={<StoreProductRoute />} />
            <Route path="/cart" element={<PlaceholderScreen name="Корзина" />} />
            <Route path="/profile" element={<PlaceholderScreen name="Профиль" />} />
            <Route path="/seller/:sellerId" element={<PlaceholderScreen name="Seller Card" />} />
            <Route path="*" element={<PlaceholderScreen name="Страница не найдена" />} />
          </Routes>
        </Page>
      )}
    </>
  );
}
