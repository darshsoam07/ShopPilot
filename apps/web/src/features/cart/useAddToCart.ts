import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addCartItem } from './api';

/** Adds one unit to the cart and returns to idle after the confirmation has been seen. */
export function useAddToCart(productId: number) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => addCartItem(productId, 1),
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
