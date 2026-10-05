// Códigos de entidades bancarias de Venezuela usados en Pago Móvil.
export const BANKS = [
  { code: '0102', name: 'Banco de Venezuela' },
  { code: '0105', name: 'Mercantil' },
  { code: '0108', name: 'Provincial' },
  { code: '0114', name: 'Bancaribe' },
  { code: '0115', name: 'Exterior' },
  { code: '0116', name: 'BOD' },
  { code: '0128', name: 'Banco Caroní' },
  { code: '0134', name: 'Banesco' },
  { code: '0138', name: 'Banco Plaza' },
  { code: '0151', name: 'BFC' },
  { code: '0163', name: 'Banco del Tesoro' },
  { code: '0172', name: 'Bancamiga' },
  { code: '0191', name: 'BNC' },
];
export const bankLabel = (code) => {
  const b = BANKS.find((x) => x.code === code);
  return b ? `${b.name} (${b.code})` : code || '—';
};
