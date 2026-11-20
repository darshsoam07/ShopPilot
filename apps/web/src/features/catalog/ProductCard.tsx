import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { ArrowRight, Check, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EDITORIAL_EASE } from '../../lib/motion';
import { getJson } from '../../services/http';
import { addCartItem } from '../cart/api';
import { ProductImage } from './ProductImage';
import { resolveProductMedia } from './productMedia';
import type { Product } from './types';

export function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const { isAuthenticated } = useAuth();
  const client = useQueryClient();
  const family = useQuery({
    queryKey: ['variants', String(product.id)],
    queryFn: () => getJson<Product[]>('/api/v1/products/' + product.id + '/variants'),
    enabled: !!product.family,
  });
  const chooseOption = !!product.family && family.data?.length !== 1;
  const add = useMutation({
    mutationFn: () => addCartItem(product.id, 1),
    onSuccess: cart => client.setQueryData(['cart'], cart),
  });
  const target = '/products/' + product.id;
  const media = resolveProductMedia(product);
  return <article className="product-card" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
    <div className="product-card__media">
      <Link to={target} aria-label={'View ' + product.name}>
        <motion.div className="product-card__img" animate={{ scale: hovered ? 1.045 : 1 }} transition={{ duration: .55, ease: EDITORIAL_EASE }}>
          <ProductImage url={(hovered && media.gallery[1]) || media.primary} name={product.name} />
        </motion.div>
      </Link>
      <div className="quick-add-bar">{chooseOption ?
        <Link to={target} className="quick-add-bar__btn">Choose option <ArrowRight size={14} /></Link> :
        !isAuthenticated && product.stock_quantity > 0 ?
        <Link to="/login" className="quick-add-bar__btn">Sign in to add to bag</Link> :
        <button type="button" className="quick-add-bar__btn" disabled={!product.stock_quantity || add.isPending} onClick={() => add.mutate()}>
          {add.isSuccess ? <Check size={14} /> : <Plus size={14} />}
          {!product.stock_quantity ? 'Sold out' : add.isPending ? 'Adding…' : add.isSuccess ? 'Added to bag' : 'Quick add'}
        </button>}</div>
    </div>
    <div className="product-card__meta"><div><span className="product-card__category">{product.category}</span>
      <h3 className="product-card__title"><Link to={target}>{product.name}</Link></h3></div>
      <span className="font-mono-tabular product-card__price">₹{Number(product.price).toLocaleString('en-IN')}</span></div>
    <small className="product-sku">{product.sku}</small>
    {add.isError && <p role="alert">{add.error.message}</p>}
  </article>;
}
