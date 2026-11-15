const apiVersion = "2026-10";

export type Money = { amount: string; currencyCode: string };
export type Img = { url: string; altText: string | null; width: number; height: number };

export type ProductCard = {
  id: string;
  handle: string;
  title: string;
  featuredImage: Img | null;
  priceRange: { minVariantPrice: Money };
  badges: { value: string } | null;
};

export type Variant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  selectedOptions: { name: string; value: string }[];
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  seo: { title: string | null; description: string | null };
  images: { nodes: Img[] };
  options: { name: string; optionValues: { name: string }[] }[];
  variants: { nodes: Variant[] };
  material: { value: string } | null;
  glaze: { value: string } | null;
  dimensions: { value: string } | null;
  care: { value: string } | null;
  badges: { value: string } | null;
  collections: { nodes: { handle: string; title: string }[] };
};

export type CollectionLink = { handle: string; title: string };

export type Collection = {
  handle: string;
  title: string;
  description: string;
  products: { nodes: ProductCard[] };
};

export type CartLine = {
  id: string;
  quantity: number;
  cost: { totalAmount: Money };
  merchandise: {
    id: string;
    title: string;
    image: Img | null;
    product: { handle: string; title: string };
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money };
  lines: { nodes: CartLine[] };
};

const cardFields = `
  id
  handle
  title
  featuredImage { url altText width height }
  priceRange { minVariantPrice { amount currencyCode } }
  badges: metafield(namespace: "ostra", key: "badges") { value }
`;

const cartFields = `
  id
  checkoutUrl
  totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 50) {
    nodes {
      id
      quantity
      cost { totalAmount { amount currencyCode } }
      merchandise {
        ... on ProductVariant {
          id
          title
          image { url altText width height }
          product { handle title }
        }
      }
    }
  }
`;

export async function storefront<T>(query: string, variables: Record<string, unknown> = {}, opts: { buyerIp?: string; catalog?: boolean } = {}): Promise<T> {
  const store = process.env.shopifystore;
  const token = process.env.storefronttoken;
  if (!store || !token) throw new Error("storefront env missing");

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "shopify-storefront-private-token": token,
  };
  if (opts.buyerIp) headers["shopify-storefront-buyer-ip"] = opts.buyerIp;

  const res = await fetch(`https://${store}/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    ...(opts.catalog ? { next: { tags: ["catalog"], revalidate: 86400 } } : { cache: "no-store" as const }),
  });
  if (!res.ok) throw new Error(`storefront ${res.status}`);

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

export async function getCollections() {
  const data = await storefront<{ collections: { nodes: CollectionLink[] } }>(`
    query Collections {
      collections(first: 20, sortKey: TITLE) { nodes { handle title } }
    }
  `, {}, { catalog: true });
  return data.collections.nodes.filter((c) => c.handle !== "frontpage");
}

export async function getFeatured() {
  const data = await storefront<{ products: { nodes: ProductCard[] } }>(`
    query Featured {
      products(first: 8, sortKey: BEST_SELLING) { nodes { ${cardFields} } }
    }
  `, {}, { catalog: true });
  return data.products.nodes;
}

export async function getCollection(handle: string) {
  const data = await storefront<{ collection: Collection | null }>(`
    query Collection($handle: String!) {
      collection(handle: $handle) {
        handle
        title
        description
        products(first: 60, sortKey: COLLECTION_DEFAULT) { nodes { ${cardFields} } }
      }
    }
  `, { handle }, { catalog: true });
  return data.collection;
}

export async function getProduct(handle: string) {
  const data = await storefront<{ product: Product | null }>(`
    query Product($handle: String!) {
      product(handle: $handle) {
        id
        handle
        title
        description
        descriptionHtml
        seo { title description }
        images(first: 10) { nodes { url altText width height } }
        options { name optionValues { name } }
        variants(first: 50) {
          nodes {
            id
            title
            availableForSale
            price { amount currencyCode }
            selectedOptions { name value }
          }
        }
        material: metafield(namespace: "ostra", key: "material") { value }
        glaze: metafield(namespace: "ostra", key: "glaze") { value }
        dimensions: metafield(namespace: "ostra", key: "dimensions") { value }
        care: metafield(namespace: "ostra", key: "care") { value }
        badges: metafield(namespace: "ostra", key: "badges") { value }
        collections(first: 1) { nodes { handle title } }
      }
    }
  `, { handle }, { catalog: true });
  return data.product;
}

export async function getProductHandles() {
  const data = await storefront<{ products: { nodes: { handle: string }[] } }>(`
    query Handles {
      products(first: 100) { nodes { handle } }
    }
  `, {}, { catalog: true });
  return data.products.nodes.map((p) => p.handle);
}

export async function fetchCart(id: string, ip?: string) {
  const data = await storefront<{ cart: Cart | null }>(`
    query Cart($id: ID!) { cart(id: $id) { ${cartFields} } }
  `, { id }, { buyerIp: ip });
  return data.cart;
}

export async function cartCreate(lines: { merchandiseId: string; quantity: number }[], ip?: string) {
  const data = await storefront<{ cartCreate: { cart: Cart | null; userErrors: { message: string }[] } }>(`
    mutation CartCreate($lines: [CartLineInput!]) {
      cartCreate(input: { lines: $lines }) {
        cart { ${cartFields} }
        userErrors { message }
      }
    }
  `, { lines }, { buyerIp: ip });
  return data.cartCreate;
}

export async function cartLinesAdd(cartId: string, lines: { merchandiseId: string; quantity: number }[], ip?: string) {
  const data = await storefront<{ cartLinesAdd: { cart: Cart | null; userErrors: { message: string }[] } }>(`
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ${cartFields} }
        userErrors { message }
      }
    }
  `, { cartId, lines }, { buyerIp: ip });
  return data.cartLinesAdd;
}

export async function cartLinesUpdate(cartId: string, lines: { id: string; quantity: number }[], ip?: string) {
  const data = await storefront<{ cartLinesUpdate: { cart: Cart | null; userErrors: { message: string }[] } }>(`
    mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ${cartFields} }
        userErrors { message }
      }
    }
  `, { cartId, lines }, { buyerIp: ip });
  return data.cartLinesUpdate;
}

export async function cartLinesRemove(cartId: string, lineIds: string[], ip?: string) {
  const data = await storefront<{ cartLinesRemove: { cart: Cart | null; userErrors: { message: string }[] } }>(`
    mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ${cartFields} }
        userErrors { message }
      }
    }
  `, { cartId, lineIds }, { buyerIp: ip });
  return data.cartLinesRemove;
}
