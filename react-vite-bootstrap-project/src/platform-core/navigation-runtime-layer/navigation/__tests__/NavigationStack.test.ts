import assert from "node:assert/strict";
import { asSellerId, asProductId } from "../../contracts/Action";
import { createNavigationState, currentEntry, push, pop, reset, isAtRoot, ROOT_ENTRY } from "../NavigationStack";

/** В проекте нет настроенного test runner'а (см. MockCatalogRepository.test.ts) —
 *  тот же формат: простой скрипт на node:assert.
 *  Запуск: npx tsx navigation/__tests__/NavigationStack.test.ts */

function run() {
  const initial = createNavigationState();
  assert.deepEqual(currentEntry(initial), ROOT_ENTRY, "createNavigationState: стартовый экран — корневой (Catalog)");
  assert.ok(isAtRoot(initial), "isAtRoot: истинно для только что созданного состояния");

  const withSeller = push(initial, { screen: "SellerCard", params: { sellerId: asSellerId("s1") } });
  assert.equal(currentEntry(withSeller).screen, "SellerCard", "push: текущий экран — только что добавленный");
  assert.equal(initial.stack.length, 1, "push: не мутирует переданное состояние");
  assert.ok(!isAtRoot(withSeller), "isAtRoot: ложно после push");

  const backToRoot = pop(withSeller);
  assert.deepEqual(currentEntry(backToRoot), ROOT_ENTRY, "pop: возвращает на предыдущий экран стека");

  const poppedAtRoot = pop(initial);
  assert.equal(poppedAtRoot, initial, "pop: на корневом экране состояние не меняется (совпадает с case BACK в GreenMarketEngine)");

  const deepStack = push(
    push(initial, { screen: "SellerCard", params: { sellerId: asSellerId("s1") } }),
    { screen: "ProductCard", params: { sellerId: asSellerId("s1"), productId: asProductId("p1") } }
  );
  assert.equal(deepStack.stack.length, 3, "push: стек накапливает несколько переходов");

  const afterReset = reset(deepStack);
  assert.deepEqual(currentEntry(afterReset), ROOT_ENTRY, "reset: сбрасывает стек к корневому экрану (case GO_TO_MAIN)");
  assert.equal(afterReset.stack.length, 1, "reset: стек после сброса содержит только корневой экран");

  console.log("NavigationStack: все проверки пройдены");
}

run();
