import { useCartStore } from '@/store/cartStore';
import { useCart, useDeleteCartItem, usePlaceOrder } from '@/hooks/useProducts';

export default function CartDrawer() {
  const { isOpen, closeCart } = useCartStore();
  const { data } = useCart();
  const deleteItem = useDeleteCartItem();
  const placeOrder = usePlaceOrder();
  const items = data?.items ?? [];
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={closeCart} />
      <div className="relative bg-white w-96 h-full shadow-xl flex flex-col z-10">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg">Cart ({items.length})</h2>
          <button onClick={closeCart} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 && (
            <p className="text-gray-400 text-sm text-center mt-8">Cart is empty</p>
          )}
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between border rounded-lg p-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{item.productName}</p>
                <p className="text-xs text-gray-500">{item.pattern} / {item.color}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Qty: {item.quantity} × ₹{item.price} ={' '}
                  <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                </p>
              </div>
              <button
                onClick={() => deleteItem.mutate(item.id)}
                className="text-red-400 hover:text-red-600 text-xs ml-2 mt-0.5"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between mb-3">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg">₹{total.toFixed(2)}</span>
            </div>
            <button
              onClick={() => placeOrder.mutate({ items })}
              disabled={placeOrder.isPending}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-60 font-medium"
            >
              {placeOrder.isPending ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
