// Belgian euro formatting — "€ 1.234,56".
const eur = new Intl.NumberFormat("nl-BE", {
  style: "currency",
  currency: "EUR",
});

export function formatEUR(amount: number): string {
  return eur.format(amount);
}
