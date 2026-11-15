import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useState, useEffect, useRef} from 'preact/hooks';
import {
  fetchProduct,
  saveSpecs,
  checkSpecs,
  parseBadges,
  filledCount,
  textFields,
  maxBadges,
} from '../../../shared/models/specs';

/** @typedef {import('../../../shared/models/specs').Specs & {badgeText: string}} Form */

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const gid = shopify.data.selected?.[0]?.id;
  const [form, setForm] = useState(/** @type {Form | null} */ (null));
  const saved = useRef(/** @type {Form | null} */ (null));
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string, string | undefined>} */ ({}));

  useEffect(() => {
    if (!gid) return;
    fetchProduct(gid)
      .then((product) => {
        if (!product) {
          setStatus('error');
          return;
        }
        const next = {...product.specs, badgeText: product.specs.badges.join(', ')};
        saved.current = next;
        setForm(next);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
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

  const summary = form ? `${filledCount(form)}/${textFields.length} specs filled` : undefined;

  return (
    <s-admin-block heading="Ostra specs" collapsedSummary={summary}>
      {status === 'loading' && <s-spinner accessibilityLabel="Loading specs" />}

      {status === 'error' && (
        <s-banner tone="critical">Specs could not be loaded.</s-banner>
      )}

      {status === 'idle' && form && (
        <s-form onSubmit={onSubmit} onReset={onReset}>
          <s-stack gap="base">
            {error && <s-banner tone="critical">{error}</s-banner>}
            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
              {textFields
                .filter((field) => field.type === 'single_line_text_field')
                .map((field) => (
                  <s-text-field
                    key={field.key}
                    label={field.label}
                    name={field.key}
                    value={form[field.key]}
                    maxLength={field.max}
                    error={fieldErrors[field.key]}
                    onInput={(e) => setField(field.key, /** @type {HTMLInputElement} */ (e.target).value)}
                  />
                ))}
              <s-text-field
                label="Badges"
                name="badges"
                value={form.badgeText}
                details={`Up to ${maxBadges}, separated by commas`}
                error={fieldErrors.badges}
                onInput={(e) => setField('badgeText', /** @type {HTMLInputElement} */ (e.target).value)}
              />
            </s-grid>
            <s-text-area
              label="Care"
              name="care"
              rows={3}
              value={form.care}
              maxLength={600}
              error={fieldErrors.care}
              onInput={(e) => setField('care', /** @type {HTMLTextAreaElement} */ (e.target).value)}
            />
          </s-stack>
        </s-form>
      )}
    </s-admin-block>
  );
}
