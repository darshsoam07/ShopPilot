import { ProductImage } from './ProductImage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { addCartItem } from '../cart/api';
import type { Cart } from '../cart/types';
import type { Product } from './types';

interface ProductCardProps { product: Product }

export function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const addMutation = useMutation({
    mutationFn: () => addCartItem(product.id, 1),
    onSuccess: (cart) => queryClient.setQueryData<Cart>(['cart'], cart),
  });

  return (
    <article className="product-card">
      <Link className="product-image-wrap" to={`/products/${product.id}`} aria-label={`View ${product.name}`}>
        <ProductImage url={product.image_url} name={product.name} />
      </Link>
      <div className="product-card-body">
        <p className="product-sku">{product.sku}</p>
        <h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3>
        <p className="product-description">{product.description}</p>
        <div className="product-card-bottom">
          <strong>₹{Number(product.price).toLocaleString('en-IN')}</strong>
          <span className={product.stock_quantity > 0 ? 'stock-good' : 'stock-out'}>{product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}</span>
        </div>
        {isAuthenticated ? (
          <>
            <button data-added={addMutation.isSuccess} type="button" className="secondary-button active-button" disabled={product.stock_quantity < 1 || addMutation.isPending} onClick={() => addMutation.mutate()}>
              {addMutation.isPending ? 'Adding…' : addMutation.isSuccess ? 'Added to cart ✓' : 'Add to cart'}
            </button>
            {addMutation.isError && <p className="inline-error" role="alert">{addMutation.error.message}</p>}
          </>
        ) : <Link className="secondary-button active-button product-login-link" to="/login">Sign in to add to cart</Link>}
      </div>
    </article>
  );
}
