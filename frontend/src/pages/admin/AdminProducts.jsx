import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import { formatRs } from '../../lib/format';
import Modal from '../../components/Modal';
import ImageUploadBox from '../../components/ImageUploadBox';
import ActiveTabs from '../../components/ActiveTabs';
import AdminFilterBar from '../../components/AdminFilterBar';
import Pagination from '../../components/Pagination';
import { confirmAction } from '../../lib/alert';

const PAGE_SIZE = 9;

const emptyForm = {
  name: '',
  product_code: '',
  description: '',
  purchase_price: '',
  sale_price: '',
  discount_percent: '',
  stock: '',
  image: '',
  category_id: '',
  featured: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  function load() {
    api.get(`/products?active=${activeTab ? '1' : '0'}`).then((res) => setProducts(res.data));
    api.get('/categories').then((res) => setCategories(res.data));
  }

  useEffect(load, [activeTab]);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      purchase_price: Number(form.purchase_price) || 0,
      sale_price: Number(form.sale_price),
      discount_percent: form.discount_percent === '' ? 0 : Number(form.discount_percent),
      stock: Number(form.stock) || 0,
      category_id: form.category_id || null,
    };
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      product_code: p.product_code || '',
      description: p.description || '',
      purchase_price: p.purchase_price,
      sale_price: p.sale_price,
      discount_percent: p.discount_percent || '',
      stock: p.stock,
      image: p.image || '',
      category_id: p.category_id || '',
      featured: !!p.featured,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleDelete(id) {
    const ok = await confirmAction({ title: 'Deactivate this product?', text: 'It will be hidden from the store until restored.' });
    if (!ok) return;
    await api.delete(`/products/${id}`);
    load();
  }

  async function handleRestore(id) {
    await api.put(`/products/${id}/restore`);
    load();
  }

  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || (p.product_code || '').toLowerCase().includes(q);
    const matchesCategory = !categoryFilter || String(p.category_id) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pagedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Products</h2>
        <button
          onClick={openAddModal}
          className="bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-4 py-2 rounded-md"
        >
          + Add Product
        </button>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Edit Product' : 'Add Product'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {error && <p className="text-red-600 text-sm sm:col-span-2">{error}</p>}
          <input
            required
            placeholder="Product name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2 sm:col-span-2"
          />
          <input
            placeholder="Product Code (e.g. 1001)"
            value={form.product_code}
            onChange={(e) => setForm({ ...form, product_code: e.target.value })}
            className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2 sm:col-span-2"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2 sm:col-span-2"
            rows={2}
          />

          <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Purchase Price</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 2400"
                value={form.purchase_price}
                onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Sale Price</label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="e.g. 3650"
                value={form.sale_price}
                onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Discount %</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="e.g. 5"
                value={form.discount_percent}
                onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Stock</label>
              <input
                required
                type="number"
                placeholder="e.g. 25"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
              />
            </div>
          </div>
          {form.sale_price && form.discount_percent > 0 && (
            <p className="sm:col-span-2 -mt-2 text-xs text-gray-500 dark:text-gray-400">
              Final price: {formatRs(Number(form.sale_price) - (Number(form.sale_price) * Number(form.discount_percent)) / 100)}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Image</label>
            <ImageUploadBox value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
          </div>

          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Featured product
          </label>

          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" className="bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-4 py-2 rounded-md">
              {editingId ? 'Update Product' : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <ActiveTabs active={activeTab} onChange={setActiveTab} />

      <AdminFilterBar search={search} onSearchChange={setSearch} placeholder="Search by name or code...">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </AdminFilterBar>

      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Code</th>
              <th className="p-3">Name</th>
              <th className="p-3">Purchase</th>
              <th className="p-3">Sale Price</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Final Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Category</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedProducts.map((p) => (
              <tr key={p.id} className="border-t border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-200">
                <td className="p-3">
                  {p.image && <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded" />}
                </td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{p.product_code || '-'}</td>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{formatRs(p.purchase_price)}</td>
                <td className="p-3">{formatRs(p.sale_price)}</td>
                <td className="p-3">
                  {Number(p.discount_percent) > 0 ? (
                    <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">
                      -{Number(p.discount_percent)}%
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-3 text-wa-green-dark dark:text-wa-green font-semibold">{formatRs(p.discount_price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{p.category_name || '-'}</td>
                <td className="p-3 whitespace-nowrap">
                  {activeTab ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        aria-label="Edit"
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                      >
                        <FontAwesomeIcon icon={faPen} size="xs" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        aria-label="Delete"
                        title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <FontAwesomeIcon icon={faTrash} size="xs" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRestore(p.id)}
                      aria-label="Restore"
                      title="Restore"
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-wa-green/10 text-wa-green-dark dark:text-wa-green hover:bg-wa-green/20"
                    >
                      <FontAwesomeIcon icon={faRotateRight} size="xs" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <p className="p-4 text-gray-500 dark:text-gray-400">No products found.</p>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
