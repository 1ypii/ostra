import {useState, useEffect, useRef} from 'preact/hooks';
import {
  fetchProduct,
  saveSpecs,
  checkSpecs,
  parseBadges,
  textFields,
  maxBadges,
  idToGid,
} from '../../../../shared/models/specs';

/** @typedef {import('../../../../shared/models/specs').Specs} Specs */
/** @typedef {Specs & {badgeText: string}} Form */

/** @param {{ id?: string }} props */
export default function ProductPage({id}) {
  const gid = idToGid(id && /^\d+$/.test(id) ? id : '0');
  const [title, setTitle] = useState('');
  const [form, setForm] = useState(/** @type {Form | null} */ (null));
  const saved = useRef(/** @type {Form | null} */ (null));
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [fieldErrors, setFieldErrors] = useState(/** @type {Partial<Record<keyof Specs, string>>} */ ({}));

  useEffect(() => {
    setStatus('loading');
    shopify.loading(true);
    fetchProduct(gid)
      .then((product) => {
        if (!product) {
          setStatus('missing');
          return;
        }
        const next = {...product.specs, badgeText: product.specs.badges.join(', ')};
        saved.current = next;
        setTitle(product.title);
        setForm(next);
        setStatus('idle');
      })
      .catch(() => setStatus('error'))
      .finally(() => shopify.loading(false));
  }, [gid]);

  /**
   * @param {string} key
   * @param {string} value
   */
  const setField = (key, value) => {
    setForm((prev) => prev && {...prev, [key]: value});
    setFieldErrors((prev) => ({...prev, [key === 'badgeText' ? 'badges' : key]: undefined}));
  };

  const save = async () => {
    if (!form) return;
    const specs = {
      material: form.material,
      glaze: form.glaze,
      dimensions: form.dimensions,
      care: form.care,
      badges: parseBadges(form.badgeText),
    };
    const errors = checkSpecs(specs);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      throw new Error('invalid');
    }

    setError(null);
    try {
      await saveSpecs(gid, specs);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Specs could not be saved');
      throw saveError;
    }
    const next = {...specs, badgeText: specs.badges.join(', ')};
    saved.current = next;
    setForm(next);
    shopify.toast.show('Specs saved');
  };

  /** @param {any} event */
  const onSubmit = (event) => {
    const promise = save();
    event?.waitUntil?.(promise);
    promise.catch(() => {});
  };

  const onReset = () => {
    if (saved.current) setForm({...saved.current});
    setFieldErrors({});
  };

  return (
    <s-page heading={title || 'Product'} inlineSize="small">
      <s-link slot="breadcrumb-actions" href="/">
        Product specs
      </s-link>

      {status === 'idle' && (
        <s-button slot="secondary-actions" href={`shopify:admin/products/${gid.split('/').pop()}`}>
          Open product
        </s-button>
      )}

      {status === 'missing' && (
        <s-section>
          <s-banner tone="warning">This product no longer exists.</s-banner>
        </s-section>
      )}

      {status === 'error' && (
        <s-section>
          <s-banner tone="critical">The product could not be loaded. Refresh to try again.</s-banner>
        </s-section>
      )}

      {error && (
        <s-section>
          <s-banner tone="critical">{error}</s-banner>
        </s-section>
      )}

      {status === 'idle' && form && (
        <s-form onSubmit={onSubmit} onReset={onReset}>
          <s-section heading="Specs">
            <s-stack gap="base">
              {textFields.map((field) =>
                field.type === 'multi_line_text_field' ? (
                  <s-text-area
                    key={field.key}
                    label={field.label}
                    name={field.key}
                    rows={3}
                    value={form[field.key]}
                    maxLength={field.max}
                    error={fieldErrors[field.key]}
                    onInput={(e) => setField(field.key, /** @type {HTMLTextAreaElement} */ (e.target).value)}
                  />
                ) : (
                  <s-text-field
                    key={field.key}
                    label={field.label}
                    name={field.key}
                    value={form[field.key]}
                    maxLength={field.max}
                    error={fieldErrors[field.key]}
                    onInput={(e) => setField(field.key, /** @type {HTMLInputElement} */ (e.target).value)}
                  />
                ),
              )}
            </s-stack>
          </s-section>
          <s-section heading="Storefront badges">
            <s-text-field
              label="Badges"
              name="badges"
              value={form.badgeText}
              details={`Up to ${maxBadges}, separated by commas. Shown by the ostra badges theme block.`}
              error={fieldErrors.badges}
              onInput={(e) => setField('badgeText', /** @type {HTMLInputElement} */ (e.target).value)}
            />
          </s-section>
        </s-form>
      )}
    </s-page>
  );
}
