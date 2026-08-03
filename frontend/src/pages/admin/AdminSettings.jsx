import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCopy,
  faRotate,
  faStore,
  faPhone,
  faPalette,
  faFileContract,
  faLink,
} from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import { useSettings } from '../../context/SettingsContext';
import { successAlert, confirmAction, errorAlert } from '../../lib/alert';
import ImageUploadBox from '../../components/ImageUploadBox';

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const DEFAULT_LOGO = '/img/logo.jpg';

const SECTIONS = [
  { key: 'general', label: 'General', icon: faStore },
  { key: 'contact', label: 'Contact', icon: faPhone },
  { key: 'appearance', label: 'Appearance', icon: faPalette },
  { key: 'legal', label: 'Legal Pages', icon: faFileContract },
  { key: 'wholesale', label: 'Wholesale Link', icon: faLink },
];

function Label({ children, hint }) {
  return (
    <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
      {children} {hint && <span className="text-gray-400">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2';

function SectionCard({ title, description, children }) {
  return (
    <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-5">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function SaveButton({ saving, disabled, children = 'Save' }) {
  return (
    <button
      type="submit"
      disabled={saving || disabled}
      className="bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md"
    >
      {saving ? 'Saving...' : children}
    </button>
  );
}

export default function AdminSettings() {
  const { settings, refreshSettings } = useSettings();
  const [activeSection, setActiveSection] = useState('general');
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [wholesaleToken, setWholesaleToken] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  useEffect(() => {
    api.get('/settings/wholesale-token').then((res) => setWholesaleToken(res.data.wholesale_token));
  }, []);

  function selectSection(key) {
    setActiveSection(key);
    setError('');
  }

  async function saveFields(fields) {
    setError('');
    setSaving(true);
    try {
      await api.put('/settings', fields);
      await refreshSettings();
      successAlert('Settings saved', 'The changes have been applied across the site.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function handleGeneralSubmit(e) {
    e.preventDefault();
    saveFields({ store_name: form.store_name, store_short_name: form.store_short_name, store_logo: form.store_logo });
  }

  function handleContactSubmit(e) {
    e.preventDefault();
    saveFields({ whatsapp_number: form.whatsapp_number, address: form.address, email: form.email });
  }

  const lightColorInvalid = !!form && !HEX_COLOR_RE.test(form.theme_color_light);
  const darkColorInvalid = !!form && !HEX_COLOR_RE.test(form.theme_color_dark);

  function handleAppearanceSubmit(e) {
    e.preventDefault();
    if (lightColorInvalid || darkColorInvalid) {
      setError('Theme colors must be a valid hex code, e.g. #1DA851');
      return;
    }
    saveFields({ theme_color_light: form.theme_color_light, theme_color_dark: form.theme_color_dark });
  }

  function handleLegalSubmit(e) {
    e.preventDefault();
    saveFields({
      terms_content: form.terms_content,
      return_policy_content: form.return_policy_content,
      privacy_policy_content: form.privacy_policy_content,
    });
  }

  const wholesaleLink = wholesaleToken ? `${window.location.origin}/wholesale-view/${wholesaleToken}` : '';

  function copyWholesaleLink() {
    navigator.clipboard.writeText(wholesaleLink);
    successAlert('Copied', 'The wholesale link has been copied to your clipboard.');
  }

  async function regenerateWholesaleLink() {
    const confirmed = await confirmAction({
      title: 'Regenerate wholesale link?',
      text: 'The current link will stop working immediately. Anyone using the old link will need the new one.',
      confirmText: 'Regenerate',
    });
    if (!confirmed) return;
    setRegenerating(true);
    try {
      const { data } = await api.post('/settings/wholesale-token/regenerate');
      setWholesaleToken(data.wholesale_token);
      successAlert('Link regenerated', 'The old wholesale link no longer works.');
    } catch {
      errorAlert('Failed', 'Could not regenerate the wholesale link.');
    } finally {
      setRegenerating(false);
    }
  }

  if (!form) return <p className="text-gray-700 dark:text-gray-300">Loading...</p>;

  return (
    <div className="max-w-5xl">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Settings</h2>

      <div className="flex flex-col lg:flex-row gap-5">
        <nav className="lg:w-52 shrink-0">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => selectSection(s.key)}
                className={`flex items-center gap-2.5 shrink-0 lg:shrink text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeSection === s.key
                    ? 'bg-wa-green text-white shadow-sm'
                    : 'bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                }`}
              >
                <FontAwesomeIcon icon={s.icon} className="w-4" />
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          {activeSection === 'general' && (
            <form onSubmit={handleGeneralSubmit}>
              <SectionCard title="General" description="Your store's name and logo, as shown across the site.">
                <div>
                  <Label>Store Name</Label>
                  <input
                    required
                    value={form.store_name}
                    onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label hint="(shown on small screens)">Store Short Name</Label>
                  <input
                    required
                    maxLength={20}
                    value={form.store_short_name}
                    onChange={(e) => setForm({ ...form, store_short_name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label hint="(also used as the site favicon)">Store Logo</Label>
                  <ImageUploadBox
                    value={form.store_logo || DEFAULT_LOGO}
                    onChange={(url) => setForm({ ...form, store_logo: url })}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave unset to use the default logo shown here.
                  </p>
                </div>
                <SaveButton saving={saving} />
              </SectionCard>
            </form>
          )}

          {activeSection === 'contact' && (
            <form onSubmit={handleContactSubmit}>
              <SectionCard title="Contact" description="Used for order alerts, seller applications, and the footer contact info.">
                <div>
                  <Label hint="(digits only, country code, no +)">Admin WhatsApp Number</Label>
                  <input
                    placeholder="e.g. 94771234567"
                    value={form.whatsapp_number || ''}
                    onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave blank to disable WhatsApp order alerts (customers can still place orders).
                  </p>
                </div>
                <div>
                  <Label>Address</Label>
                  <input
                    placeholder="e.g. Colombo, Sri Lanka"
                    value={form.address || ''}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <input
                    type="email"
                    placeholder="e.g. info@yourstore.com"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Address and email shown in the footer's Contact section.
                  </p>
                </div>
                <SaveButton saving={saving} />
              </SectionCard>
            </form>
          )}

          {activeSection === 'appearance' && (
            <form onSubmit={handleAppearanceSubmit}>
              <SectionCard title="Appearance" description="Theme colors used for buttons, links, and the header/footer.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Light Theme Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={HEX_COLOR_RE.test(form.theme_color_light) ? form.theme_color_light : '#000000'}
                        onChange={(e) => setForm({ ...form, theme_color_light: e.target.value })}
                        className="w-10 h-10 shrink-0 rounded border border-gray-300 dark:border-neutral-700 bg-transparent"
                      />
                      <input
                        type="text"
                        value={form.theme_color_light}
                        onChange={(e) => setForm({ ...form, theme_color_light: e.target.value })}
                        placeholder="#1DA851"
                        maxLength={7}
                        className={`flex-1 min-w-0 border rounded px-3 py-2 text-sm font-mono uppercase dark:bg-neutral-800 dark:text-gray-100 ${
                          lightColorInvalid ? 'border-red-400' : 'border-gray-300 dark:border-neutral-700'
                        }`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used in light mode.</p>
                  </div>
                  <div>
                    <Label>Dark Theme Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={HEX_COLOR_RE.test(form.theme_color_dark) ? form.theme_color_dark : '#000000'}
                        onChange={(e) => setForm({ ...form, theme_color_dark: e.target.value })}
                        className="w-10 h-10 shrink-0 rounded border border-gray-300 dark:border-neutral-700 bg-transparent"
                      />
                      <input
                        type="text"
                        value={form.theme_color_dark}
                        onChange={(e) => setForm({ ...form, theme_color_dark: e.target.value })}
                        placeholder="#25D366"
                        maxLength={7}
                        className={`flex-1 min-w-0 border rounded px-3 py-2 text-sm font-mono uppercase dark:bg-neutral-800 dark:text-gray-100 ${
                          darkColorInvalid ? 'border-red-400' : 'border-gray-300 dark:border-neutral-700'
                        }`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used in dark mode.</p>
                  </div>
                </div>
                <SaveButton saving={saving} disabled={lightColorInvalid || darkColorInvalid} />
              </SectionCard>
            </form>
          )}

          {activeSection === 'legal' && (
            <form onSubmit={handleLegalSubmit}>
              <SectionCard
                title="Legal Pages"
                description="Shown on the public Terms & Conditions, Return Policy, and Privacy Policy pages (linked from the footer and mobile menu)."
              >
                <div>
                  <Label>Terms &amp; Conditions</Label>
                  <textarea
                    rows={8}
                    value={form.terms_content || ''}
                    onChange={(e) => setForm({ ...form, terms_content: e.target.value })}
                    className={`${inputClass} font-normal text-sm leading-relaxed resize-y`}
                  />
                </div>
                <div>
                  <Label>Return Policy</Label>
                  <textarea
                    rows={8}
                    value={form.return_policy_content || ''}
                    onChange={(e) => setForm({ ...form, return_policy_content: e.target.value })}
                    className={`${inputClass} font-normal text-sm leading-relaxed resize-y`}
                  />
                </div>
                <div>
                  <Label>Privacy Policy</Label>
                  <textarea
                    rows={8}
                    value={form.privacy_policy_content || ''}
                    onChange={(e) => setForm({ ...form, privacy_policy_content: e.target.value })}
                    className={`${inputClass} font-normal text-sm leading-relaxed resize-y`}
                  />
                </div>
                <SaveButton saving={saving} />
              </SectionCard>
            </form>
          )}

          {activeSection === 'wholesale' && (
            <SectionCard
              title="Wholesale Price List Link"
              description="A no-login page showing every product's cost price, for trusted sellers/buyers only. Anyone with this link can view it, so only share it with people you trust - if it ever leaks, regenerate it below to instantly kill the old link."
            >
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={wholesaleLink}
                  placeholder="Loading..."
                  className="flex-1 min-w-0 border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono truncate"
                />
                <button
                  type="button"
                  onClick={copyWholesaleLink}
                  disabled={!wholesaleLink}
                  title="Copy link"
                  className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              </div>
              <button
                type="button"
                onClick={regenerateWholesaleLink}
                disabled={regenerating || !wholesaleToken}
                className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faRotate} spin={regenerating} />
                {regenerating ? 'Regenerating...' : 'Regenerate Link'}
              </button>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
