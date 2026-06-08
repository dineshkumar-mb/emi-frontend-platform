export const GEO_CONFIGS = {
  IN: { code: 'IN', label: 'India (₹)', symbol: '₹', locale: 'en-IN', currency: 'INR' },
  US: { code: 'US', label: 'United States ($)', symbol: '$', locale: 'en-US', currency: 'USD' },
  GB: { code: 'GB', label: 'United Kingdom (£)', symbol: '£', locale: 'en-GB', currency: 'GBP' },
  EU: { code: 'EU', label: 'Europe (€)', symbol: '€', locale: 'de-DE', currency: 'EUR' },
  AE: { code: 'AE', label: 'United Arab Emirates (د.إ)', symbol: 'د.إ', locale: 'en-AE', currency: 'AED' }
};

export const getGeoConfig = (geoCode) => {
  return GEO_CONFIGS[geoCode] || GEO_CONFIGS.IN;
};

export const formatCurrency = (amount, geoCode) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'N/A';
  }
  const config = getGeoConfig(geoCode);
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};
