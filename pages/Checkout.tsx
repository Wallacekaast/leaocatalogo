
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Send, ChevronLeft, Loader2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';

const Checkout: React.FC = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    notes: ''
  });

  const totalPrice = cart.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    return acc + (price * item.quantity);
  }, 0);

  const handleSendOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Seu carrinho está vazio!");
    
    setLoading(true);

    // 1. Tratamento do número
    let cleanNumber = settings.whatsapp_number.replace(/\D/g, '');
    if (cleanNumber.length <= 11 && !cleanNumber.startsWith('55')) {
      cleanNumber = '55' + cleanNumber;
    }

    // 2. Tenta salvar no banco ANTES de ir para o WhatsApp
    try {
      const { error: dbError } = await supabase.from('orders').insert([{
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_city: formData.city,
        items: cart,
        notes: formData.notes,
        total_price: totalPrice
      }]);

      if (dbError) {
        console.error("Erro Supabase:", dbError);
        // Se der erro de coluna ausente, avisamos o dev no console mas deixamos o cliente seguir
        if (dbError.code === '42703') {
          console.warn("DICA: A coluna 'total_price' ou 'customer_city' pode estar faltando na sua tabela 'orders'.");
        }
      }
    } catch (err) {
      console.error("Erro crítico ao salvar no banco:", err);
    }

    // 3. Preparar mensagem do WhatsApp
    let message = `*NOVO PEDIDO - ${settings.store_name}*\n\n`;
    message += `*Cliente:* ${formData.name}\n`;
    message += `*WhatsApp:* ${formData.phone}\n`;
    message += `*Localização:* ${formData.city}\n\n`;
    message += `*ÍTENS DO PEDIDO:*\n`;
    
    cart.forEach((item, index) => {
      const itemPrice = Number(item.price) || 0;
      message += `${index + 1}. ${item.name}\n`;
      message += `   - Cor: ${item.selectedColor || 'Padrão'}\n`;
      message += `   - Tecido: ${item.selectedFabric || 'Padrão'}\n`;
      message += `   - Qtd: ${item.quantity}\n`;
      message += `   - Subtotal: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemPrice * item.quantity)}\n\n`;
    });

    if (formData.notes) message += `*Observações:* ${formData.notes}\n\n`;
    message += `*VALOR TOTAL ESTIMADO: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}*`;

    // 4. Redirecionar
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setTimeout(() => {
      clearCart();
      setLoading(false);
      navigate('/');
    }, 500);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-20 h-20 text-slate-200 mx-auto mb-6" />
        <h2 className="text-2xl font-serif text-slate-900 mb-4">Seu orçamento está vazio</h2>
        <p className="text-slate-500 mb-8">Navegue pelo nosso catálogo para escolher seus favoritos.</p>
        <button onClick={() => navigate('/')} className="bg-brand-secondary text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-primary transition-all">Voltar ao Catálogo</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full border border-slate-200 shadow-sm hover:text-brand-primary">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-serif text-slate-900">Finalizar Orçamento</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Itens Selecionados ({cart.length})</h3>
              <button onClick={clearCart} className="text-sm text-red-500 hover:underline font-medium">Limpar tudo</button>
            </div>
            <div className="divide-y divide-slate-100">
              {cart.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="p-6 flex flex-col sm:flex-row gap-6">
                  <img src={item.images[0]} className="w-24 h-24 object-cover rounded-xl shadow-sm" alt={item.name} />
                  <div className="flex-grow">
                    <h4 className="font-bold text-slate-900">{item.name}</h4>
                    <p className="text-slate-500 text-sm mb-2">
                      {item.selectedColor && `Cor: ${item.selectedColor}`} 
                      {item.selectedFabric && ` • Tecido: ${item.selectedFabric}`}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">Qtd: {item.quantity}</span>
                      <span className="font-bold text-brand-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(item.price) || 0) * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-300 hover:text-red-500 self-start transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-50 flex justify-between items-center border-t border-slate-100">
              <span className="text-lg font-bold text-slate-900">Total Estimado:</span>
              <span className="text-2xl font-black text-brand-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <form onSubmit={handleSendOrder} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 sticky top-28">
            <h3 className="text-xl font-serif text-slate-900 mb-4 border-b pb-4 border-slate-100 text-center uppercase tracking-widest">{settings.store_name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">Seu Nome</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all" placeholder="Ex: João da Silva" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">WhatsApp de Contato</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all" placeholder="(21) 99999-9999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">Cidade / Bairro</label>
                <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all" placeholder="Onde você mora?" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">Observações (Opcional)</label>
                <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none min-h-[100px] transition-all" placeholder="Algum detalhe sobre a entrega ou o móvel?" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  Enviar Pedido WhatsApp
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
