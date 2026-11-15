import {useState, useEffect} from 'preact/hooks';
import {useLocation} from 'preact-iso';
import {listProducts, filledCount, textFields} from '../../../../shared/models/specs';
import {gidToId} from '../../../../shared/utils/gid';

/** @typedef {import('../../../../shared/models/specs').ProductRow} ProductRow */

export default function HomePage() {
  const {route} = useLocation();
  const [products, setProducts] = useState(/** @type {ProductRow[]} */ ([]));
  const [status, setStatus] = useState('loading');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    shopify.loading(true);
    listProducts()
      .then((rows) => {
        setProducts(rows);
        setStatus('idle');
      })
      .catch(() => setStatus('error'))
      .finally(() => shopify.loading(false));
  }, []);

  /**
   * @param {Event} event
   * @param {ProductRow} product
   */
  const open = (event, product) => {
    const click = /** @type {MouseEvent} */ (event);
    if (click.button !== 0 || click.metaKey || click.ctrlKey || click.shiftKey) return;
    click.preventDefault();
    route(`/product/${gidToId(product.id)}`);
  };

  const total = textFields.length;
  const complete = products.filter((p) => filledCount(p.specs) === total).length;
  const shown = filter === 'missing'
    ? products.filter((p) => filledCount(p.specs) < total)
    : products;

  return (
    <s-page heading="Product specs">
      {status === 'error' && (
        <s-section>
          <s-banner tone="critical">Products could not be loaded. Refresh to try again.</s-banner>
        </s-section>
      )}

      {status === 'idle' && (
        <s-section>
          <s-stack direction="inline" justifyContent="space-between" alignItems="center" gap="base">
            <s-paragraph>
              {complete} of {products.length} products have every spec filled in.
            </s-paragraph>
            <s-select
              label="Show"
              labelAccessibilityVisibility="exclusive"
              value={filter}
              onChange={(e) => setFilter(/** @type {HTMLSelectElement} */ (e.target).value)}
            >
              <s-option value="all">All products</s-option>
              <s-option value="missing">Missing specs</s-option>
            </s-select>
          </s-stack>
        </s-section>
      )}

      {status === 'idle' && (
        <s-section padding="none" accessibilityLabel="Products">
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="primary">Product</s-table-header>
              <s-table-header>Specs</s-table-header>
              <s-table-header>Badges</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {shown.map((product) => {
                const filled = filledCount(product.specs);
                return (
                  <s-table-row key={product.id}>
                    <s-table-cell>
                      <s-stack direction="inline" gap="small-200" alignItems="center">
                        <s-thumbnail src={product.image ?? undefined} alt={product.title} size="small" />
                        <s-link
                          href={`/product/${gidToId(product.id)}`}
                          onClick={(event) => open(event, product)}
                        >
                          {product.title}
                        </s-link>
                      </s-stack>
                    </s-table-cell>
                    <s-table-cell>
                      <s-badge tone={filled === total ? 'success' : 'warning'}>
                        {filled}/{total}
                      </s-badge>
                    </s-table-cell>
                    <s-table-cell>
                      {product.specs.badges.length ? (
                        <s-stack direction="inline" gap="small-300">
                          {product.specs.badges.map((badge) => (
                            <s-chip key={badge}>{badge}</s-chip>
                          ))}
                        </s-stack>
                      ) : (
                        <s-text color="subdued">None</s-text>
                      )}
                    </s-table-cell>
                  </s-table-row>
                );
              })}
            </s-table-body>
          </s-table>
        </s-section>
      )}
    </s-page>
  );
}
