import { useEffect, useMemo, useState } from 'react';
import { Navigate, Routes, Route, NavLink, useLocation, useParams } from 'react-router-dom';
import { PlaceholderScreen } from '@/screens/PlaceholderScreen';
import { MapScreenView } from '@/screens/map/MapScreenView';
import { SellerListScreenView } from '@/screens/seller-list/SellerListScreenView';
import { Header, Page, Row } from '@/layout';
import '@/buyer_mvp/buyer_mvp.css';
import { CatalogScreen } from '@/buyer_mvp/screens/CatalogScreen';
import { ProductScreen } from '@/buyer_mvp/screens/ProductScreen';
import { SellerCardScreen } from '@/buyer_mvp/screens/SellerCardScreen';
import { StoreHomeScreen } from '@/buyer_mvp/screens/StoreHomeScreen';
import { GreenBoardScreen } from '@/buyer_mvp/screens/GreenBoardScreen';
import { globalCatalogContext, storeCatalogContext } from '@/buyer_mvp/catalogContext';
import {
  isStoreModePathAllowed,
  storeModeAfterNavigation,
  storeModeFromPath,
  storeModeLandingPath,
  type StoreMode,
} from '@/app/storeMode';

const navItems = [
  { to: '/', label: 'Каталог' },
  { to: '/map', label: 'Карта' },
  { to: '/seller-list', label: 'Продавцы' },
  { to: '/green-board', label: 'О Green Board' },
];

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
  const [storeMode, setStoreMode] = useState<StoreMode>(() => storeModeFromPath(location.pathname, location.search));
  const routeStoreMode = useMemo(() => storeModeFromPath(location.pathname, location.search), [location.pathname, location.search]);

  useEffect(() => {
    if (routeStoreMode.active) setStoreMode((current) => storeModeAfterNavigation(current, location.pathname, location.search));
  }, [location.pathname, location.search, routeStoreMode]);

  if (storeMode.active && !isStoreModePathAllowed(location.pathname, storeMode.storeId, location.search)) {
    return <Navigate to={storeModeLandingPath(storeMode.storeId)} replace />;
  }

  const isMapRoute = !storeMode.active && location.pathname === '/map';

  return (
    <>
      {!storeMode.active && <TopNav />}
      {isMapRoute ? (
        <Routes>
          <Route path="/map" element={<MapScreenView />} />
        </Routes>
      ) : (
        <Page>
          <Routes>
            <Route path="/" element={<CatalogScreen context={globalCatalogContext} />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/catalog" element={<LegacyCatalogRedirect />} />
            <Route path="/green-board" element={<GreenBoardScreen />} />
            <Route path="/product/:productId" element={<ProductScreen context={globalCatalogContext} />} />
            <Route path="/seller-list" element={<SellerListScreenView />} />
            <Route path="/store/:storeId" element={<StoreHomeScreen />} />
            <Route path="/store/:storeId/catalog" element={<StoreCatalogRoute />} />
            <Route path="/store/:storeId/product/:productId" element={<StoreProductRoute />} />
            <Route path="/cart" element={<PlaceholderScreen name="Корзина" />} />
            <Route path="/profile" element={<PlaceholderScreen name="Профиль" />} />
            <Route path="/seller/:sellerId" element={<SellerCardScreen />} />
            <Route path="*" element={<PlaceholderScreen name="Страница не найдена" />} />
          </Routes>
        </Page>
      )}
    </>
  );
}
