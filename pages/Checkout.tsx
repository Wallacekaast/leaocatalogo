
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

  const totalPrice = cart.reduce((acc, item) => acc + (Number(item.price || 0) * item.quantity), 0);

  const handleSendOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Seu carrinho está vazio!");
    
    setLoading(true);

    try {
      // 1. Salvar no Banco de Dados
      const { error } = await supabase.from('orders').insert([{
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_city: formData.city,
        items: cart,
        total_price: totalPrice,
        notes: formData.notes
      }]);

      if (error) throw error;

      // 2. Preparar mensagem do WhatsApp
      let message = `Olá, gostaria de fazer um pedido:\n\n`;
      message += `*Cliente:* ${formData.name}\n`;
      message += `*Telefone:* ${formData.phone}\n`;
      message += `*Cidade:* ${formData.city}\n\n`;
      message += `*Produtos:*\n`;
      
      cart.forEach(item => {
        message += `- ${item.name} | Cor: ${item.selectedColor || 'N/A'} | Tecido: ${item.selectedFabric || 'N/A'} | Qtd: ${item.quantity}\n`;
      });

      if (formData.notes) {
        message += `\n*Observações:* ${formData.notes}`;
      }

      message += `\n\n*Total Estimado:* ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}`;

      const whatsappUrl = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`;
      
      // 3. Abrir WhatsApp e Limpar
      window.open(whatsappUrl, '_blank');
      clearCart();
      navigate('/');
    } catch (err: any) {
      alert("Erro ao processar pedido: " + err.message);
    } finally {
      setLoading(false);
    }
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
              {cart.map(item => (
                <div key={`${item.id}-${item.selectedColor}-${item.selectedFabric}`} className="p-6 flex flex-col sm:flex-row gap-6">
                  <img src={item.images[0]} className="w-24 h-24 object-cover rounded-xl" alt={item.name} />
                  <div className="flex-grow">
                    <h4 className="font-bold text-slate-900">{item.name}</h4>
                    <p className="text-slate-500 text-sm mb-2">Cor: {item.selectedColor} • Tecido: {item.selectedFabric}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-slate-700">Qtd: {item.quantity}</span>
                      <span className="font-bold text-brand-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.price) * item.quantity)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-400 hover:text-red-500 self-start transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-50 flex justify-between items-center">
              <span className="text-lg font-bold text-slate-900">Total Estimado:</span>
              <span className="text-2xl font-bold text-brand-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <form onSubmit={handleSendOrder} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 sticky top-28">
            <h3 className="text-xl font-serif text-slate-900 mb-4 border-b pb-4 border-slate-100 text-center uppercase tracking-widest">{settings.store_name}</h3>
            <div><label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label><input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" placeholder="Ex: João da Silva" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-2">Seu WhatsApp</label><input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" placeholder="(21) 99999-9999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-2">Cidade/Bairro</label><input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-2">Observações</label><textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none min-h-[80px]" placeholder="Algum detalhe especial?" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {loading ? 'Processando...' : 'Enviar Pedido WhatsApp'}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4 leading-tight">Ao clicar, seu pedido será registrado e você será levado ao WhatsApp oficial: {settings.whatsapp_number}.</p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
