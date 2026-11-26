import { useState } from 'react';

interface ProductImageProps {
  priority?: boolean;
  url: string | null;
  name: string;
}

const API_ORIGIN = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

/** Uploaded media is served by the API; everything else is an absolute or public URL. */
export function resolveImageSrc(url: string) {
  return url.startsWith('/media/') ? API_ORIGIN + url : url;
}

export function ProductImage({ url, name, priority = false }: ProductImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || url === failedUrl) {
    const initials = name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('');
    return <span className="product-monogram" role="img" aria-label={name + ' image unavailable'}>{initials}</span>;
  }

  return (
    <img className="catalog-product-photo" src={resolveImageSrc(url)}
      width={900} height={1125} decoding="async" alt={name}
      loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'}
      onError={() => setFailedUrl(url)} />
  );
}
