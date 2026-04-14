'use client';

type GoldRates = {
  rate_22k: number;
  rate_18k: number;
  rate_14k: number;
  updated_at?: string;
};

type Props = {
  purity?: string;
  rates: GoldRates | null;
};

const PURITY_OPTIONS = [
  { key: '22k', label: '22K', field: 'rate_22k' as const },
  { key: '18k', label: '18K', field: 'rate_18k' as const },
  { key: '14k', label: '14K', field: 'rate_14k' as const },
];

export default function PurityGoldRate({ purity = '22k', rates }: Props) {
  const activeKey = purity?.toLowerCase();
  const activeOption = PURITY_OPTIONS.find((o) => o.key === activeKey) || PURITY_OPTIONS[0];
  const activeRate = rates ? Number(rates[activeOption.field]) : 0;

  return (
    <div className="border border-gold/20 rounded-sm p-4 bg-white mb-5">
      <div className="text-[10px] text-gray-400 tracking-[1px] uppercase mb-2">Live Gold Rate by Purity</div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {PURITY_OPTIONS.map((option) => (
          <div
            key={option.key}
            className={`text-center py-2 rounded-sm text-[12px] border ${
              option.key === activeOption.key
                ? 'border-gold bg-amber-50 text-gold font-semibold'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            <div>{option.label}</div>
            <div className="text-[11px]">
              ₹{Number(rates?.[option.field] || 0).toLocaleString('en-IN')}/g
            </div>
          </div>
        ))}
      </div>
      <div className="text-[13px] text-gray-600">
        Current {activeOption.label} rate: <span className="font-semibold text-black">₹{activeRate.toLocaleString('en-IN')}/g</span>
      </div>
      {rates?.updated_at && (
        <div className="text-[11px] text-gray-400 mt-1">
          Updated: {new Date(rates.updated_at).toLocaleString('en-IN')}
        </div>
      )}
    </div>
  );
}