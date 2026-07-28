// All menu prices are tax-inclusive. Given a line total and the GST rate that
// applies to that item, back-calculate the taxable value and the CGST/SGST
// split (each half of the total GST rate, per standard Indian intra-state
// GST convention) so admin sales reports can show the tax breakup without
// changing anything the customer sees.

export type TaxBreakup = {
  taxableValue: number;
  cgst: number;
  sgst: number;
  totalTax: number;
};

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeTaxBreakup(
  inclusiveAmount: number,
  gstRatePercent: number
): TaxBreakup {
  if (!gstRatePercent || gstRatePercent <= 0) {
    return { taxableValue: round2(inclusiveAmount), cgst: 0, sgst: 0, totalTax: 0 };
  }
  const taxableValue = inclusiveAmount / (1 + gstRatePercent / 100);
  const totalTax = inclusiveAmount - taxableValue;
  return {
    taxableValue: round2(taxableValue),
    cgst: round2(totalTax / 2),
    sgst: round2(totalTax / 2),
    totalTax: round2(totalTax),
  };
}

export function sumTaxBreakups(breakups: TaxBreakup[]): TaxBreakup {
  return breakups.reduce(
    (acc, b) => ({
      taxableValue: round2(acc.taxableValue + b.taxableValue),
      cgst: round2(acc.cgst + b.cgst),
      sgst: round2(acc.sgst + b.sgst),
      totalTax: round2(acc.totalTax + b.totalTax),
    }),
    { taxableValue: 0, cgst: 0, sgst: 0, totalTax: 0 }
  );
}
