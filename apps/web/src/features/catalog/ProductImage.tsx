import { useState } from 'react';

interface ProductImageProps {
  url: string | null;
  name: string;
}

export function ProductImage({ url, name }: ProductImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || url === failedUrl) {
    const initials = name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('');
    return <span className="product-monogram" role="img" aria-label={name + ' image unavailable'}>{initials}</span>;
  }

  const apiOrigin = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
  return (
    <img className="catalog-product-photo" src={url.startsWith('/media/') ? apiOrigin + url : url}
      alt={name} loading="lazy" onError={() => setFailedUrl(url)} />
  );
}
