import { MessageCircle, X, Minus, Plus, Trash2, Send, ArrowLeft, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCartContext } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const WHATSAPP_NUMBER = '525574053955';

// WhatsApp icon component
export const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Cart button component for the header
export const CartButton = ({ onClick }: { onClick: () => void }) => {
  const { totalItems } = useCartContext();
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTotalRef = useRef(totalItems);

  useEffect(() => {
    if (totalItems > prevTotalRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    prevTotalRef.current = totalItems;
  }, [totalItems]);

  return (
    <button
      onClick={onClick}
      aria-label="Abrir pedido"
      className={cn(
        "relative p-2 rounded-full transition-all duration-200",
        "hover:bg-whatsapp/20",
        isAnimating && "animate-bounce"
      )}
    >
      <WhatsAppIcon className="w-6 h-6 text-whatsapp" />
      {totalItems > 0 && (
        <span 
          className={cn(
            "absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-whatsapp text-white text-[10px] font-bold rounded-full",
            isAnimating && "animate-scale-in"
          )}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
};

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

type DrawerView = 'cart' | 'confirm';

const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const { items, totalItems, updateQuantity, removeItem, clearCart } = useCartContext();
  const [view, setView] = useState<DrawerView>('cart');
  const [clientName, setClientName] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // Reset view when drawer closes
  useEffect(() => {
    if (!open) {
      setView('cart');
    }
  }, [open]);

  const groupedItems = () => {
    const grouped: Record<string, typeof items> = {};
    items.forEach(item => {
      if (!grouped[item.brandName]) {
        grouped[item.brandName] = [];
      }
      grouped[item.brandName].push(item);
    });
    return grouped;
  };

  const generateWhatsAppMessage = () => {
    if (items.length === 0) return '';

    let message = '¡Hola! 👋 Nuevo pedido:\n\n';

    if (clientName.trim()) {
      message += `👤 *Cliente:* ${clientName.trim()}\n`;
    }
    if (orderNote.trim()) {
      message += `📝 *Nota:* ${orderNote.trim()}\n`;
    }
    if (clientName.trim() || orderNote.trim()) {
      message += '\n';
    }

    const grouped = groupedItems();
    Object.entries(grouped).forEach(([brandName, brandItems]) => {
      message += `📦 *${brandName}*\n`;
      brandItems.forEach(item => {
        message += `   • ${item.flavorName} x${item.quantity}\n`;
      });
      message += '\n';
    });

    message += `━━━━━━━━━━━━━━━\n`;
    message += `📊 *Total: ${totalItems} productos*\n\n`;
    message += `¡Gracias! 🙏`;

    return encodeURIComponent(message);
  };

  const sendToWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(url, '_blank');
    clearCart();
    setClientName('');
    setOrderNote('');
    setView('cart');
    onClose();
  };

  const grouped = groupedItems();

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-background shadow-xl flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 bg-whatsapp-dark text-white">
          <div className="flex items-center gap-2">
            {view === 'confirm' && (
              <button onClick={() => setView('cart')} className="hover:opacity-70 transition-opacity mr-1">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <WhatsAppIcon className="w-5 h-5" />
            <h2 className="font-medium text-lg">
              {view === 'cart' ? 'Tu Pedido' : 'Confirmar Pedido'}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar pedido" className="hover:opacity-70 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* === CART VIEW === */}
        {view === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {items.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">Tu pedido está vacío</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">Agrega sabores para enviar por WhatsApp</p>
                </div>
              )}

              {items.map((item) => (
                <div key={item.productId} className="flex items-start gap-3 border-b border-border pb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.flavorName}</p>
                    <p className="text-xs text-muted-foreground">{item.brandName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded border border-border hover:bg-muted transition-colors"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded border border-border hover:bg-muted transition-colors"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-destructive hover:opacity-70 transition-opacity"
                    aria-label="Eliminar del pedido"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <footer className="px-4 py-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total de productos</span>
                  <span className="font-medium">{totalItems}</span>
                </div>
                <button
                  onClick={() => setView('confirm')}
                  className="w-full py-3 flex items-center justify-center gap-2 bg-whatsapp hover:bg-whatsapp-dark text-white font-medium rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Continuar al envío</span>
                </button>
                <button
                  onClick={clearCart}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Vaciar pedido
                </button>
              </footer>
            )}
          </>
        )}

        {/* === CONFIRM VIEW === */}
        {view === 'confirm' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {/* Client info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Datos del pedido
                </h3>
                <div className="space-y-2">
                  <Input
                    placeholder="Nombre del cliente o dueño de orden *"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="bg-input border-border text-sm"
                    maxLength={100}
                  />
                  <Input
                    placeholder="Nota adicional (opcional)"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    className="bg-input border-border text-sm"
                    maxLength={200}
                  />
                </div>
              </div>

              {/* Order summary */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Resumen del pedido</h3>
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                  {Object.entries(grouped).map(([brandName, brandItems]) => (
                    <div key={brandName}>
                      <p className="text-xs font-semibold text-primary mb-1">📦 {brandName}</p>
                      {brandItems.map(item => (
                        <p key={item.productId} className="text-xs text-muted-foreground pl-4">
                          • {item.flavorName} x{item.quantity}
                        </p>
                      ))}
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="text-sm font-medium">📊 Total: {totalItems} productos</p>
                  </div>
                </div>
              </div>
            </div>

            <footer className="px-4 py-4 border-t border-border space-y-3">
              <button
                onClick={sendToWhatsApp}
                disabled={!clientName.trim()}
                className={cn(
                  "w-full py-3 flex items-center justify-center gap-2 text-white font-medium rounded-lg transition-colors",
                  clientName.trim()
                    ? "bg-whatsapp hover:bg-whatsapp-dark"
                    : "bg-muted-foreground/30 cursor-not-allowed"
                )}
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span>Enviar por WhatsApp</span>
              </button>
              <p className="text-[11px] text-center text-muted-foreground">
                Se abrirá WhatsApp con tu pedido listo para enviar
              </p>
            </footer>
          </>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
