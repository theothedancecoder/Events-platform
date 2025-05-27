import { CURRENCY, type Currency } from '@/constants/currency'

export const formatPrice = (
  price: string | number,
  currency: Currency = CURRENCY
) => {
  const amount = typeof price === 'string' ? parseFloat(price) : price

  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
  }).format(amount)
}

export const formatPriceDisplay = (
  price: string | number,
  isFree: boolean,
  currency: Currency = CURRENCY
) => {
  if (isFree) return 'FREE'
  return formatPrice(price, currency)
}
