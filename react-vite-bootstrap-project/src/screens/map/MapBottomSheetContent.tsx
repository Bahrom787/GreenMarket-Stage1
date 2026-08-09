import type { Action } from '@/platform-core/contracts/Action';
import type { ContentBlock } from '@/platform-core/contracts/ContentBlock';
import { Text, Card, Button, Loader, EmptyState, ErrorState, ListItem } from '@/design-system/components';
import { Stack } from '@/layout';

/**
 * Минимальный рендерер ContentBlock[] для Bottom Sheet экрана Map. Полного
 * переиспользуемого BottomSheetRenderer в присланном архиве нет — вся
 * отрисовка блоков жила внутри одного BottomSheetDeclarative.tsx (1193
 * строки), откуда наружу экспортированы только типы и *Adapter. Обрабатывает
 * только подмножество ContentBlock, которое реально производит
 * MapSheetAdapter (hero/sectionLabel/metaLine/text/cardList/list/skeleton/
 * errorRetry/empty) — не претендует на замену общего рендерера для
 * остальных экранов.
 */
export function MapBottomSheetContent({
  blocks,
  onRetry,
  onAction,
}: {
  blocks: ContentBlock[];
  onRetry: () => void;
  onAction: (action: Action) => void;
}) {
  return (
    <Stack gap="md">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'skeleton':
            return <Loader key={index} />;
          case 'errorRetry':
            return (
              <ErrorState
                key={index}
                title={block.text}
                action={
                  <Button variant="secondary" onClick={onRetry}>
                    Повторить
                  </Button>
                }
              />
            );
          case 'empty':
            return <EmptyState key={index} title={block.text} />;
          case 'hero':
            return (
              <div
                key={index}
                style={{
                  height: 120,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-sunken)',
                }}
                aria-hidden="true"
              />
            );
          case 'sectionLabel':
            return (
              <Text key={index} variant="title" as="h3" data-testid="sheet-section">
                {block.text}
              </Text>
            );
          case 'metaLine':
            return (
              <Text key={index} tone="secondary">
                {block.text}
              </Text>
            );
          case 'text':
            return (
              <Text key={index} tone="secondary">
                {block.text}
              </Text>
            );
          case 'list':
            return (
              <Card key={index}>
                <Stack gap="xs">
                  {block.items.map((item) => (
                    <ListItem
                      key={item.id}
                      onClick={() => item.action && onAction(item.action)}
                      leading={item.avatar ? <Text as="span">{item.avatar}</Text> : undefined}
                      data-testid="seller-list-row"
                    >
                      <Text variant="bodyStrong">{item.title}</Text>
                      {item.subtitle && (
                        <Text variant="caption" tone="secondary">
                          {item.subtitle}
                        </Text>
                      )}
                    </ListItem>
                  ))}
                </Stack>
              </Card>
            );
          case 'cardList':
            return (
              <Card key={index}>
                <Stack gap="sm">
                  {block.items.map((item) => (
                    <Button
                      key={item.id}
                      onClick={() => item.action && onAction(item.action)}
                      data-testid="open-seller-card"
                    >
                      {item.title}
                    </Button>
                  ))}
                </Stack>
              </Card>
            );
          default:
            return null;
        }
      })}
    </Stack>
  );
}
