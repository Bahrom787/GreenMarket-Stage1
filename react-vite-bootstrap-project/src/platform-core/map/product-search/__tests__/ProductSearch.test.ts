import assert from "node:assert/strict";
import { it } from "vitest";
import { asSellerId } from "@/platform-core/contracts/Action";
import {
  findDirectProductMatches,
  findMostSimilarProduct,
  normalizeProductSearch,
  searchProducts,
  stringSimilarityPercent,
  type ProductSearchCandidate,
  type ProductSearchListing,
  type ProductSearchSellerRef,
} from "../ProductSearch";

function seller(id: string, name: string): ProductSearchSellerRef {
  return { sellerId: asSellerId(id), name };
}

const candidates: ProductSearchCandidate[] = [
  { name: "Milk", normalizedName: "milk", tags: ["dairy"] },
  { name: "Tomatoes", normalizedName: "tomatoes", tags: ["tomato", "vegetables"] },
];

const listings: ProductSearchListing[] = [
  { productName: "Milk", seller: seller("seller-1", "A"), price: 120, unit: "l", tags: ["dairy"] },
  { productName: "Milk", seller: seller("seller-2", "B"), price: 110, unit: "l", tags: ["dairy"] },
  { productName: "Tomatoes", seller: seller("seller-3", "C"), price: 90, unit: "kg", tags: ["tomato"] },
];

it("runs ProductSearch contract checks", () => {
  assert.equal(normalizeProductSearch("  MILK  "), "milk");
  assert.equal(normalizeProductSearch("мёд"), "мед");
  assert.deepEqual(findDirectProductMatches("", candidates), []);
  assert.equal(findDirectProductMatches("milk", candidates)[0]?.name, "Milk");
  assert.equal(findDirectProductMatches(" TOMATO ", candidates)[0]?.name, "Tomatoes");
  assert.equal(stringSimilarityPercent("milk", "milk"), 100);
  assert.equal(findMostSimilarProduct("tomatos", candidates, 80)?.name, "Tomatoes");

  const result = searchProducts("milk", listings);
  assert.equal(result.matchedProduct, "Milk");
  assert.equal(result.suggestedProduct, null);
  assert.deepEqual(
    result.sellers.map((match) => [match.seller.sellerId, match.price]),
    [
      [asSellerId("seller-2"), 110],
      [asSellerId("seller-1"), 120],
    ],
  );

  assert.deepEqual(searchProducts("missing", listings), {
    matchedProduct: null,
    suggestedProduct: null,
    sellers: [],
  });
});
