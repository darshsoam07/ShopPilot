import type { Product } from './types';

type MediaProduct = Pick<Product, 'sku' | 'image_url'> & Partial<Pick<Product, 'gallery_images' | 'specifications'>>;

// These bundled photographs all depict the Obsidian finish.
const obsidianPhoto = /^\/demo\/nova(?:-detail-[1-4])?\.jpg$/;

export function resolveProductMedia(product: MediaProduct) {
  const alabaster = product.sku === 'AUD-NOVA-ALB' || product.specifications?.Finish === 'Alabaster';
  const urls = [product.image_url, ...(product.gallery_images ?? [])];
  const gallery = [...new Set(urls.filter((url): url is string => {
    if (!url?.trim()) return false;
    if (!alabaster) return true;
    try {
      const path = new URL(url, 'https://store.invalid').pathname;
      return !obsidianPhoto.test(path) && url !== 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900';
    } catch { return false; }
  }))];
  return { primary: gallery[0] ?? null, gallery };
}

export function selectedProductImage(gallery: string[], selected: string) {
  return gallery.includes(selected) ? selected : gallery[0] ?? null;
}
