const sip = (monthly, years, annualPct) => {
  const i = annualPct / 12 / 100;
  const n = years * 12;
  const invested = monthly * n;
  const fv = i === 0 ? invested : monthly * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
  return { invested, value: fv, returns: fv - invested, pct: invested ? ((fv - invested) / invested) * 100 : 0 };
};

const lumpsum = (principal, years, annualPct) => {
  const fv = principal * Math.pow(1 + annualPct / 100, years);
  return { invested: principal, value: fv, returns: fv - principal, pct: principal ? ((fv - principal) / principal) * 100 : 0 };
};

const rd = (monthly, years, annualPct) => {
  const r = annualPct / 100;
  const n = 4;
  const months = years * 12;
  let fv = 0;
  for (let j = 1; j <= months; j++) {
    const tiy = (months - j + 1) / 12;
    fv += monthly * Math.pow(1 + r / n, n * tiy);
  }
  const invested = monthly * months;
  return { invested, value: fv, returns: fv - invested, pct: invested ? ((fv - invested) / invested) * 100 : 0 };
};

const fd = (principal, years, annualPct, freq = 4) => {
  const r = annualPct / 100;
  const fv = principal * Math.pow(1 + r / freq, freq * years);
  return { invested: principal, value: fv, returns: fv - principal, pct: principal ? ((fv - principal) / principal) * 100 : 0 };
};

const ppf = (yearly, years) => {
  const r = 0.071;
  const invested = yearly * years;
  const fv = yearly * (((Math.pow(1 + r, years) - 1) / r) * (1 + r));
  return { invested, value: fv, returns: fv - invested, pct: invested ? ((fv - invested) / invested) * 100 : 0, rate: 7.1 };
};

const runAll = (params) => ({
  sip: sip(params.sipMonthly || 0, params.years || 0, params.sipRate || 12),
  mf: lumpsum(params.mfLumpsum || 0, params.years || 0, params.mfRate || 13),
  rd: rd(params.rdMonthly || 0, params.years || 0, params.rdRate || 7.5),
  fd: fd(params.fdPrincipal || 0, params.years || 0, params.fdRate || 6.8, 4),
  ppf: ppf(params.ppfYearly || 0, Math.min(params.years || 0, 15))
});

module.exports = { sip, lumpsum, rd, fd, ppf, runAll };
