import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addCartItem } from './api';

/** Adds `quantity` units (default 1) and returns to idle after the confirmation has been seen. */
export function useAddToCart(productId: number) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (quantity: number | void) => addCartItem(productId, quantity || 1),
    onSuccess: cart => client.setQueryData(['cart'], cart),
  });
  const { isSuccess, reset } = mutation;
  useEffect(() => {
    if (!isSuccess) return;
    const timer = window.setTimeout(reset, 2200);
    return () => window.clearTimeout(timer);
  }, [isSuccess, reset]);
  return mutation;
}
