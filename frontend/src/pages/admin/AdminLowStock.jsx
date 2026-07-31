import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import { formatRs } from '../../lib/format';
import Modal from '../../components/Modal';
import AdminFilterBar from '../../components/AdminFilterBar';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 9;

export default function AdminLowStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockValue, setStockValue] = useState('');
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api
      .get('/products?lowStock=true')
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  function startEdit(product) {
    setEditingProduct(product);
    setStockValue('');
    setError('');
  }

  function closeModal() {
    setEditingProduct(null);
    setStockValue('');
    setError('');
  }

  const addedStock = Number(stockValue) || 0;
  const updatedStock = (editingProduct?.stock || 0) + addedStock;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/products/${editingProduct.id}`, { stock: updatedStock });
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock');
    }
  }

  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.product_code || '').toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pagedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <p className="text-gray-700 dark:text-gray-300">Loading...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Low Stock ({products.length})</h2>

      <AdminFilterBar search={search} onSearchChange={setSearch} placeholder="Search by name or code..." />

      <Modal open={!!editingProduct} onClose={closeModal} title="Update Stock">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <p className="font-medium text-gray-900 dark:text-gray-100">{editingProduct?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Current stock: <span className="font-semibold text-gray-900 dark:text-gray-100">{editingProduct?.stock}</span>
          </p>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Add Stock</label>
            <input
              required
              type="number"
              min="0"
              value={stockValue}
              onChange={(e) => setStockValue(e.target.value)}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Updated stock: <span className="font-semibold text-wa-green-dark dark:text-wa-green">{updatedStock}</span>
            <span className="text-gray-400 dark:text-gray-500"> ({editingProduct?.stock} + {addedStock})</span>
          </p>
          <div className="flex gap-2">
            <button type="submit" className="bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-4 py-2 rounded-md">
              Save
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

      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Code</th>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Sale Price</th>
              <th className="p-3">Stock</th>
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
                <td className="p-3 text-gray-500 dark:text-gray-400">{p.category_name || '-'}</td>
                <td className="p-3">{formatRs(p.sale_price)}</td>
                <td className="p-3">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      p.stock === 0
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                    }`}
                  >
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => startEdit(p)}
                    aria-label="Update stock"
                    title="Update stock"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                  >
                    <FontAwesomeIcon icon={faPen} size="xs" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <p className="p-4 text-gray-500 dark:text-gray-400">No low stock products.</p>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
