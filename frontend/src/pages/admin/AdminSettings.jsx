import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCopy,
  faRotate,
  faStore,
  faPhone,
  faPalette,
  faFileContract,
  faLink,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import { useSettings } from '../../context/SettingsContext';
import { successAlert, confirmAction, errorAlert } from '../../lib/alert';
import ImageUploadBox from '../../components/ImageUploadBox';
import LoadingBlock from '../../components/LoadingBlock';

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const DEFAULT_LOGO = '/img/logo.jpg';

export const SETTINGS_SECTIONS = [
  { key: 'general', label: 'General', icon: faStore },
  { key: 'contact', label: 'Contact', icon: faPhone },
  { key: 'appearance', label: 'Appearance', icon: faPalette },
  { key: 'legal', label: 'Legal Pages', icon: faFileContract },
  { key: 'email', label: 'Email (SMTP)', icon: faEnvelope },
  { key: 'wholesale', label: 'Wholesale Link', icon: faLink },
];
const SECTIONS = SETTINGS_SECTIONS;

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
  const [searchParams] = useSearchParams();
  const requestedSection = searchParams.get('tab');
  const activeSection = SECTIONS.some((s) => s.key === requestedSection) ? requestedSection : 'general';
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [wholesaleToken, setWholesaleToken] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [emailForm, setEmailForm] = useState(null);
  const [fonts, setFonts] = useState([]);
  const [previewFont, setPreviewFont] = useState(null);
  const [fontSnippet, setFontSnippet] = useState('');
  const [addingFont, setAddingFont] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  useEffect(() => {
    api.get('/settings/wholesale-token').then((res) => setWholesaleToken(res.data.wholesale_token));
    api.get('/settings/email').then((res) => setEmailForm(res.data));
    api.get('/fonts').then((res) => setFonts(res.data));
  }, []);

  // Only takes the saved value once, so the dropdown isn't yanked back to
  // the saved font while the admin is mid-preview of a different one.
  useEffect(() => {
    if (form?.active_font && previewFont === null) setPreviewFont(form.active_font);
  }, [form, previewFont]);

  // Loads every registered font's stylesheet while this page is open, so the
  // preview below can render whichever one is picked in the dropdown - not
  // just the site's currently active font.
  useEffect(() => {
    const links = fonts.map((f) => {
      let link = document.getElementById(`font-preview-${f.id}`);
      if (!link) {
        link = document.createElement('link');
        link.id = `font-preview-${f.id}`;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${f.family_param}&display=swap`;
        document.head.appendChild(link);
      }
      return link;
    });
    return () => links.forEach((link) => link.remove());
  }, [fonts]);

  useEffect(() => {
    setError('');
  }, [activeSection]);

  async function saveFields(fields) {
    setError('');
    const confirmed = await confirmAction({
      title: 'Save these changes?',
      text: 'This will update the settings live across the site.',
      confirmText: 'Save',
    });
    if (!confirmed) return;

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
    saveFields({
      store_name: form.store_name,
      store_short_name: form.store_short_name,
      store_logo: form.store_logo,
      store_icon: form.store_icon,
    });
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
    saveFields({
      theme_color_light: form.theme_color_light,
      theme_color_dark: form.theme_color_dark,
      active_font: previewFont,
    });
  }

  async function handleAddFont() {
    setError('');
    setAddingFont(true);
    try {
      const { data } = await api.post('/fonts', { snippet: fontSnippet });
      setFonts(data.fonts);
      setFontSnippet('');
      if (data.added.length > 0) {
        successAlert('Font added', `Added: ${data.added.join(', ')}`);
      } else {
        errorAlert('Nothing new', 'Every font in that snippet is already in the list.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add font');
    } finally {
      setAddingFont(false);
    }
  }

  function handleEmailSubmit(e) {
    e.preventDefault();
    saveFields({
      smtp_host: emailForm.smtp_host,
      smtp_port: emailForm.smtp_port ? Number(emailForm.smtp_port) : null,
      smtp_user: emailForm.smtp_user,
      smtp_pass: emailForm.smtp_pass,
      email_from: emailForm.email_from,
    });
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

  if (!form) return <LoadingBlock className="py-16" />;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Settings</h2>

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
                <div>
                  <Label hint="(rounded icon shown next to the store name in the navbar)">Store Icon</Label>
                  <ImageUploadBox
                    value={form.store_icon}
                    onChange={(url) => setForm({ ...form, store_icon: url })}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave unset to show just the store name with no icon.
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

                <div className="pt-2 border-t border-gray-100 dark:border-neutral-800">
                  <Label hint="(used across the whole site)">Font Style</Label>
                  <select
                    value={previewFont || ''}
                    onChange={(e) => setPreviewFont(e.target.value)}
                    className={inputClass}
                  >
                    {fonts.map((f) => (
                      <option key={f.id} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 rounded-lg border border-gray-200 dark:border-neutral-700 p-5 text-center">
                    <p
                      className="text-2xl text-gray-900 dark:text-gray-100"
                      style={{ fontFamily: previewFont ? `"${previewFont}", sans-serif` : undefined }}
                    >
                      Here is the Font Style
                    </p>
                  </div>
                </div>

                <div>
                  <Label hint="(paste a Google Fonts <link> snippet to add more options above)">Add New Font</Label>
                  <textarea
                    rows={3}
                    value={fontSnippet}
                    onChange={(e) => setFontSnippet(e.target.value)}
                    placeholder='<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">'
                    className={`${inputClass} font-mono text-xs`}
                  />
                  <button
                    type="button"
                    onClick={handleAddFont}
                    disabled={addingFont || !fontSnippet.trim()}
                    className="mt-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 font-semibold text-sm px-3.5 py-2 rounded-md"
                  >
                    {addingFont ? 'Adding...' : 'Add Font'}
                  </button>
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

          {activeSection === 'email' && (
            emailForm ? (
              <form onSubmit={handleEmailSubmit}>
                <SectionCard
                  title="Email (SMTP)"
                  description="Used to send 6-digit verification codes for signup, seller applications, and password resets. Free options: Brevo (300 emails/day) or Resend (100/day). Leave blank to print codes to the server console instead of emailing them (useful for local testing)."
                >
                  <div>
                    <Label hint="(e.g. smtp-relay.brevo.com)">SMTP Host</Label>
                    <input
                      value={emailForm.smtp_host || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label hint="(usually 587)">SMTP Port</Label>
                    <input
                      type="number"
                      value={emailForm.smtp_port || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, smtp_port: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label>SMTP Username</Label>
                    <input
                      value={emailForm.smtp_user || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, smtp_user: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label>SMTP Password</Label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={emailForm.smtp_pass || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, smtp_pass: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <Label hint='(the "from" address customers see)'>Email From</Label>
                    <input
                      type="email"
                      placeholder="e.g. no-reply@yourstore.com"
                      value={emailForm.email_from || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, email_from: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <SaveButton saving={saving} />
                </SectionCard>
              </form>
            ) : (
              <LoadingBlock className="py-10" />
            )
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
  );
}
