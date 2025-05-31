export default function roundToNDecimal(n: number | bigint | string, decimals = 2) {
  const precision = 10 ** decimals
  return Math.round(Number(n) * precision) / precision
}
