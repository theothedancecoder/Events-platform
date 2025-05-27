export const CURRENCY = {
  symbol: '$',
  code: 'USD',
  locale: 'en-US'
} as const

export type Currency = typeof CURRENCY

// Can be expanded to support multiple currencies
export const SUPPORTED_CURRENCIES = {
  USD: {
    symbol: '$',
    code: 'USD',
    locale: 'en-US'
  },
  NOK: {
    symbol: 'kr',
    code: 'NOK',
    locale: 'nb-NO'
  }
} as const
