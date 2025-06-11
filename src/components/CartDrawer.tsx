
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import CheckoutAddressStep from "./CheckoutAddressStep";
import CheckoutPaymentStep from "./CheckoutPaymentStep";
import CheckoutSuccessStep from "./CheckoutSuccessStep";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Address {
  id?: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

type CheckoutStep = 'cart' | 'address' | 'payment' | 'success';

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentId, setPaymentId] = useState<string>('');
  
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleStartCheckout = () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para finalizar sua compra",
        variant: "destructive",
      });
      navigate("/login");
      onClose();
      return;
    }
    
    if (items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de finalizar",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep('address');
  };

  const handleAddressContinue = (address: Address) => {
    setSelectedAddress(address);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = (payment_id: string) => {
    setPaymentId(payment_id);
    setCurrentStep('success');
  };

  const handleBackToCart = () => {
    setCurrentStep('cart');
    setSelectedAddress(null);
  };

  const handleBackToAddress = () => {
    setCurrentStep('address');
  };

  const handleClose = () => {
    setCurrentStep('cart');
    setSelectedAddress(null);
    setPaymentId('');
    onClose();
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'cart':
        return `Carrinho (${totalItems} ${totalItems === 1 ? 'item' : 'itens'})`;
      case 'address':
        return 'Endereço de Entrega';
      case 'payment':
        return 'Pagamento';
      case 'success':
        return 'Pedido Finalizado';
      default:
        return 'Carrinho';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            {getStepTitle()}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col mt-6">
          {currentStep === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Carrinho vazio</h3>
                  <p className="text-gray-500 mb-4">Adicione algumas músicas ao seu carrinho</p>
                  <Button onClick={handleClose} className="rounded-full">
                    Continuar Navegando
                  </Button>
                </div>
              ) : (
                <>
                  {/* Lista de itens */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.artist}</p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="inline-block px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
                              {item.category}
                            </span>
                            <span className="font-medium text-primary">
                              R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          
                          {/* Controles de quantidade */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-8 w-8 p-0 rounded-full"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-sm font-medium min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 p-0 rounded-full"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4 flex-shrink-0" />

                  {/* Resumo do pedido */}
                  <div className="flex-shrink-0">
                    <h3 className="font-medium text-gray-900 mb-3">Resumo do pedido</h3>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg mb-4">
                      <span>Total</span>
                      <span className="text-primary">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  {/* Ações do carrinho */}
                  <div className="space-y-3 flex-shrink-0 pb-4">
                    <Button
                      variant="outline"
                      onClick={clearCart}
                      className="w-full rounded-full py-3 text-sm font-medium"
                    >
                      Limpar Carrinho
                    </Button>
                    
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 rounded-full py-3 text-sm font-medium"
                      onClick={handleStartCheckout}
                    >
                      Finalizar Pedido
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {currentStep === 'address' && (
            <div className="flex-1 overflow-y-auto">
              <CheckoutAddressStep
                onContinue={handleAddressContinue}
                onBack={handleBackToCart}
              />
            </div>
          )}

          {currentStep === 'payment' && selectedAddress && (
            <div className="flex-1 overflow-y-auto">
              <CheckoutPaymentStep
                address={selectedAddress}
                onBack={handleBackToAddress}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          )}

          {currentStep === 'success' && (
            <div className="flex-1 overflow-y-auto">
              <CheckoutSuccessStep
                paymentId={paymentId}
                onClose={handleClose}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
