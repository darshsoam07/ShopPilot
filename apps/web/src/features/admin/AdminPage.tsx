import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, patchJson, postJson, uploadFile } from '../../services/http';
import type { Product, ProductListResponse } from '../catalog/types';

interface CreateProductPayload {
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: string;
  stock_quantity: number;
}

export function AdminPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [imageFiles, setImageFiles] = useState<Record<number, File>>({});
  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => getJson<ProductListResponse>('/api/v1/admin/products?limit=100'),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateProductPayload) => postJson<Product>('/api/v1/admin/products', payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); setMessage('Product created.'); setError(''); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Could not create product.'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, stock_quantity }: { id: number; stock_quantity: number }) => patchJson<Product>(`/api/v1/admin/products/${id}`, { stock_quantity }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); setMessage('Inventory updated.'); setError(''); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Could not update inventory.'),
  });
  const deactivateMutation = useMutation({
    mutationFn: (id: number) => patchJson<Product>(`/api/v1/admin/products/${id}`, { is_active: false }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); setMessage('Product deactivated.'); setError(''); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Could not deactivate product.'),
  });
  const imageMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadFile<Product>(`/api/v1/admin/products/${id}/image`, file),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); setMessage('Product image uploaded.'); setError(''); },
    onError: (cause) => setError(cause instanceof Error ? cause.message : 'Could not upload product image.'),
  });

  function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const name = String(values.get('name') ?? '').trim();
    const sku = String(values.get('sku') ?? '').trim();
    const payload: CreateProductPayload = {
      name,
      slug: String(values.get('slug') ?? '').trim(),
      description: String(values.get('description') ?? '').trim(),
      sku,
      price: String(values.get('price') ?? '0'),
      stock_quantity: Number(values.get('stock_quantity') ?? 0),
    };
    setMessage(''); setError(''); createMutation.mutate(payload);
    event.currentTarget.reset();
  }

  return (
    <section className="page-section admin-page">
      <div className="page-heading"><p className="eyebrow">SHOPPILOT CONTROL PANEL</p><h1>Administration</h1><p>Manage the product catalogue and inventory. Access is checked by the API on every request.</p></div>
      {message && <div className="success-note">{message}</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="admin-layout">
        <form className="checkout-panel admin-create-form" onSubmit={createProduct}>
          <p className="eyebrow">CATALOGUE</p><h2>Add a product</h2>
          <label>Product name<input name="name" minLength={2} required /></label>
          <label>Slug<input name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="wireless-headphones" required /></label>
          <label>SKU<input name="sku" minLength={2} required /></label>
          <label>Description<textarea name="description" rows={3} /></label>
          <div className="checkout-fields"><label>Price (₹)<input name="price" type="number" min="0" step="0.01" required /></label><label>Initial stock<input name="stock_quantity" type="number" min="0" step="1" defaultValue="0" required /></label></div>
          <button className="primary-button auth-submit" type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating…' : 'Create product'}</button>
        </form>
        <div className="admin-catalogue">
          <div className="admin-catalogue-heading"><div><p className="eyebrow">INVENTORY</p><h2>Products</h2></div><span>{productsQuery.data?.total ?? 0} total</span></div>
          {productsQuery.isPending && <div className="state-panel">Loading products…</div>}
          {productsQuery.isError && <div className="state-panel error-state">{productsQuery.error.message}</div>}
          {productsQuery.data?.items.map((product) => <AdminProductRow key={product.id} product={product} imageFile={imageFiles[product.id]} onImageFile={(file) => setImageFiles((current) => { const next = { ...current }; if (file) next[product.id] = file; else delete next[product.id]; return next; })} onSaveStock={(stock) => updateMutation.mutate({ id: product.id, stock_quantity: stock })} onDeactivate={() => deactivateMutation.mutate(product.id)} onUpload={() => imageFiles[product.id] && imageMutation.mutate({ id: product.id, file: imageFiles[product.id] })} busy={updateMutation.isPending || deactivateMutation.isPending || imageMutation.isPending} />)}
        </div>
      </div>
    </section>
  );
}

function AdminProductRow({ product, imageFile, onImageFile, onSaveStock, onDeactivate, onUpload, busy }: {
  product: Product;
  imageFile?: File;
  onImageFile: (file: File | undefined) => void;
  onSaveStock: (stock: number) => void;
  onDeactivate: () => void;
  onUpload: () => void;
  busy: boolean;
}) {
  const [stock, setStock] = useState(String(product.stock_quantity));
  return (
    <article className={`admin-product-row ${product.is_active ? '' : 'admin-product-inactive'}`}>
      <div className="admin-product-info"><strong>{product.name}</strong><small>{product.sku} · ₹{Number(product.price).toLocaleString('en-IN')}</small><span>{product.is_active ? 'Active' : 'Inactive'}</span></div>
      <label className="admin-stock-field">Stock<input type="number" min="0" step="1" value={stock} onChange={(event) => setStock(event.target.value)} /></label>
      <button type="button" className="admin-small-button" disabled={busy || !product.is_active || !/^\d+$/.test(stock)} onClick={() => onSaveStock(Number(stock))}>Save stock</button>
      <div className="admin-image-actions"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onImageFile(event.target.files?.[0])} /><button type="button" className="admin-small-button" disabled={busy || !imageFile || !product.is_active} onClick={onUpload}>Upload image</button></div>
      <button type="button" className="text-button" disabled={busy || !product.is_active} onClick={onDeactivate}>Deactivate</button>
    </article>
  );
}
