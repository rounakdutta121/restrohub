/** Active (non-voided) line total for a table order. */
export function orderSubtotal(
  items: { price: number; quantity: number; voided?: boolean }[]
) {
  return items
    .filter((i) => !i.voided)
    .reduce((sum, i) => sum + i.price * i.quantity, 0);
}
