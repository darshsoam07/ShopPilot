import { Link } from 'react-router-dom';
import { Check, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAddToCart } from '../cart/useAddToCart';
import { ProductImage } from '../catalog/ProductImage';
import { resolveProductMedia } from '../catalog/productMedia';
import type { Product } from '../catalog/types';

/** Compact, action-capable product row for the command palette. Reads like a card, scans like a list. */
export function AssistantProductRow({ product, onNavigate }: { product: Product; onNavigate?: () => void }) {
  const { isAuthenticated } = useAuth();
  const add = useAddToCart(product.id);
  const inStock = product.stock_quantity > 0;
  const target = '/products/' + product.id;
  const needsChoice = !!product.family;

  return (
    <div className="result-row">
      <div className="result-row__thumb"><ProductImage url={resolveProductMedia(product).primary} name={product.name} /></div>
      <div className="result-row__info">
        <Link to={target} onClick={onNavigate} className="result-row__name" data-palette-item>{product.name}</Link>
        <p className="result-row__meta"><span className="tnum">{product.sku}</span><span className="price tnum">₹{Number(product.price).toLocaleString('en-IN')}</span></p>
      </div>
      {needsChoice ? (
        <Link to={target} onClick={onNavigate} className="result-row__action">View options</Link>
      ) : !inStock ? (
        <span className="result-row__action" aria-disabled="true">Sold out</span>
      ) : !isAuthenticated ? (
        <Link to="/login" onClick={onNavigate} className="result-row__action">Sign in to add</Link>
      ) : (
        <button type="button" className="result-row__action" disabled={add.isPending} onClick={() => add.mutate()}>
          {add.isSuccess ? <Check size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
          {add.isPending ? 'Adding…' : add.isSuccess ? 'Added to cart' : 'Add to cart'}
        </button>
      )}
      {add.isError && <p className="result-row__error" role="alert">{add.error.message}</p>}
    </div>
  );
}
