export default function PriceBreakdown({ room, nights, promoResult, taxRate = 18, extraBed = false }) {
  if (!room || !nights) return null;

  const extraBedCharge = extraBed ? 500 * nights : 0;
  const base = (room.base_price * nights) + extraBedCharge;
  const discount = promoResult?.is_valid ? Number(promoResult.discount_amount) : 0;
  const taxable = base - discount;
  const tax = (taxable * taxRate) / 100;
  const total = taxable + tax;

  return (
    <div className="bg-gray-50 rounded-xl p-5 space-y-3 text-sm">
      <h3 className="font-semibold text-gray-900 text-base">Price Breakdown</h3>
      <div className="flex justify-between text-gray-600">
        <span>₹{Number(room.base_price).toLocaleString()} × {nights} night{nights > 1 ? "s" : ""}</span>
        <span>₹{(room.base_price * nights).toLocaleString()}</span>
      </div>
      {extraBed && (
        <div className="flex justify-between text-gray-600">
          <span>Extra Bed (₹500 × {nights})</span>
          <span>+ ₹{extraBedCharge.toLocaleString()}</span>
        </div>
      )}
      {discount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Discount ({promoResult.code})</span>
          <span>− ₹{discount.toLocaleString()}</span>
        </div>
      )}
      <div className="flex justify-between text-gray-600">
        <span>GST ({taxRate}%)</span>
        <span>₹{tax.toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-3">
        <span>Total</span>
        <span>₹{total.toFixed(2)}</span>
      </div>
    </div>
  );
}