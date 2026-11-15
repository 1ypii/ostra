import { idToGid } from "../utils/gid";

export interface Specs {
  material: string;
  glaze: string;
  dimensions: string;
  care: string;
  badges: string[];
}

export interface ProductRow {
  id: string;
  title: string;
  image: string | null;
  specs: Specs;
}

export const textFields = [
  { key: "material", label: "Material", type: "single_line_text_field", max: 120 },
  { key: "glaze", label: "Glaze", type: "single_line_text_field", max: 120 },
  { key: "dimensions", label: "Dimensions", type: "single_line_text_field", max: 120 },
  { key: "care", label: "Care", type: "multi_line_text_field", max: 600 },
] as const;

export const maxBadges = 3;
export const maxBadgeLength = 24;

const specFields = `
  material: metafield(namespace: "ostra", key: "material") { value }
  glaze: metafield(namespace: "ostra", key: "glaze") { value }
  dimensions: metafield(namespace: "ostra", key: "dimensions") { value }
  care: metafield(namespace: "ostra", key: "care") { value }
  badges: metafield(namespace: "ostra", key: "badges") { value }
`;

async function gql(query: string, variables?: Record<string, unknown>) {
  const res = await fetch("shopify:admin/api/2026-07/graphql.json", {
    method: "POST",
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`admin api ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

function readSpecs(node: any): Specs {
  let badges: string[] = [];
  try {
    badges = node.badges?.value ? JSON.parse(node.badges.value) : [];
  } catch {
    badges = [];
  }
  return {
    material: node.material?.value ?? "",
    glaze: node.glaze?.value ?? "",
    dimensions: node.dimensions?.value ?? "",
    care: node.care?.value ?? "",
    badges,
  };
}

export function filledCount(specs: Specs) {
  return textFields.filter((f) => specs[f.key].trim() !== "").length;
}

export function parseBadges(input: string) {
  return input
    .split(",")
    .map((b) => b.trim().toLowerCase())
    .filter(Boolean);
}

export function checkSpecs(specs: Specs) {
  const errors: Partial<Record<keyof Specs, string>> = {};
  for (const f of textFields) {
    if (specs[f.key].length > f.max) errors[f.key] = `Keep it under ${f.max} characters`;
  }
  if (specs.badges.length > maxBadges) {
    errors.badges = `Up to ${maxBadges} badges`;
  } else if (specs.badges.some((b) => b.length > maxBadgeLength)) {
    errors.badges = `Each badge under ${maxBadgeLength} characters`;
  }
  return errors;
}

export async function listProducts(): Promise<ProductRow[]> {
  const data = await gql(
    `#graphql
    query OstraProducts {
      products(first: 100, sortKey: TITLE) {
        nodes {
          id
          title
          featuredMedia { preview { image { url(transform: { maxWidth: 80, maxHeight: 80 }) } } }
          ${specFields}
        }
      }
    }`,
  );
  return data.products.nodes.map((node: any) => ({
    id: node.id,
    title: node.title,
    image: node.featuredMedia?.preview?.image?.url ?? null,
    specs: readSpecs(node),
  }));
}

export async function fetchProduct(gid: string): Promise<ProductRow | null> {
  const data = await gql(
    `#graphql
    query OstraProduct($id: ID!) {
      product(id: $id) {
        id
        title
        featuredMedia { preview { image { url(transform: { maxWidth: 80, maxHeight: 80 }) } } }
        ${specFields}
      }
    }`,
    { id: gid },
  );
  const node = data.product;
  if (!node) return null;
  return {
    id: node.id,
    title: node.title,
    image: node.featuredMedia?.preview?.image?.url ?? null,
    specs: readSpecs(node),
  };
}

export async function saveSpecs(gid: string, specs: Specs) {
  const set: Record<string, string>[] = [];
  const remove: Record<string, string>[] = [];

  for (const f of textFields) {
    const value = specs[f.key].trim();
    if (value) {
      set.push({ ownerId: gid, namespace: "ostra", key: f.key, type: f.type, value });
    } else {
      remove.push({ ownerId: gid, namespace: "ostra", key: f.key });
    }
  }

  if (specs.badges.length) {
    set.push({
      ownerId: gid,
      namespace: "ostra",
      key: "badges",
      type: "list.single_line_text_field",
      value: JSON.stringify(specs.badges),
    });
  } else {
    remove.push({ ownerId: gid, namespace: "ostra", key: "badges" });
  }

  if (set.length) {
    const data = await gql(
      `#graphql
      mutation OstraSetSpecs($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { field message }
        }
      }`,
      { metafields: set },
    );
    if (data.metafieldsSet.userErrors.length) throw new Error(data.metafieldsSet.userErrors[0].message);
  }

  if (remove.length) {
    const data = await gql(
      `#graphql
      mutation OstraClearSpecs($metafields: [MetafieldIdentifierInput!]!) {
        metafieldsDelete(metafields: $metafields) {
          userErrors { field message }
        }
      }`,
      { metafields: remove },
    );
    if (data.metafieldsDelete.userErrors.length) throw new Error(data.metafieldsDelete.userErrors[0].message);
  }
}

export { idToGid };
