# REST API

## Catalog Photos

`photos` in Catalog API responses are SellerProduct / offer photos, not canonical Product photos.

- `GET /catalog/products`: `products[].photos` is a preview from seller offer data. It must not be treated as `Product.photos`.
- `GET /catalog/products/{productId}`: each `offers[].photos` belongs only to that offer / SellerProduct.
- `GET /catalog/sellers/{storeId}/products`: each `products[].photos` belongs to that seller product.

Frontend must not aggregate photos from different sellers into a product-level gallery unless a future backend contract adds explicit Product photos.
