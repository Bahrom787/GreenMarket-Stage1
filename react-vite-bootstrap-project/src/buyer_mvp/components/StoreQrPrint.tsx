import { useId, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ModalContainer } from '@/containers';
import { Button, Surface, Text } from '@/design-system/components';
import { Row, Stack } from '@/layout';
import type { StoreHomeViewModel } from '../storeHomePresentation';

export interface StoreQrPrintProps {
  store: StoreHomeViewModel;
}

export function StoreQrPrintMaterial({
  store,
  publicUrl,
  titleId,
}: {
  store: StoreHomeViewModel;
  publicUrl: string;
  titleId?: string;
}) {
  return (
    <div className="gm-store-qr__print" data-testid="store-qr-print-material" data-qr-payload={publicUrl}>
      <Text variant="headline" as="h2" id={titleId}>
        {store.title}
      </Text>
      <div className="gm-store-qr__code">
        <QRCodeSVG
          value={publicUrl}
          size={224}
          marginSize={4}
          level="M"
          role="img"
          aria-label={`QR-код магазина ${store.title}`}
        />
      </div>
      <Text variant="body" tone="secondary">
        Откройте магазин камерой телефона
      </Text>
    </div>
  );
}

export function StoreQrPrint({ store }: StoreQrPrintProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const publicUrl = store.publicIdentity?.publicUrl;

  if (!publicUrl) return null;

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Печать QR-кода
      </Button>

      {open && (
        <ModalContainer labelledBy={titleId} onDismiss={() => setOpen(false)}>
          <Surface className="gm-store-qr" bordered elevation={3}>
            <Stack gap="lg">
              <StoreQrPrintMaterial store={store} publicUrl={publicUrl} titleId={titleId} />

              <Row gap="sm" wrap className="gm-store-qr__actions">
                <Button onClick={() => window.print()}>Печать</Button>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Закрыть
                </Button>
              </Row>
            </Stack>
          </Surface>
        </ModalContainer>
      )}
    </>
  );
}
