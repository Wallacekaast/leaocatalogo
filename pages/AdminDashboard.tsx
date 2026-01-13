
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, LogOut, Settings, Save, AlertCircle, X, 
  Phone, Upload, Image as ImageIcon, Loader2, Layers, Palette, 
  Ruler, Tag, Mail, MapPin, Clock, ShoppingBag, Eye, Calendar, 
  User as UserIcon, RefreshCw, CheckCircle, Hash, Search, Filter,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, AppSettings, Order } from '../types';
import { useSettings } from '../contexts/SettingsContext';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Filtro
  const [orderSearch, setOrderSearch] = useState('');
  const [orderDateFilter, setOrderDateFilter] = useState('');
  
  // Modais
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<AppSettings>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    description: '',
    category: 'sofa',
    price: 0,
    colors: [],
    fabrics: [],
    dimensions: '',
    images: [],
    active: true
  });

  const [colorsInput, setColorsInput] = useState('');
  const [fabricsInput, setFabricsInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => {
    checkAuth();
    fetchData();

    // INSCRIÇÃO REALTIME: Ouve novos pedidos e atualiza a lista instantaneamente
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', table: 'orders', schema: 'public' }, (payload) => {
        setOrders(prev => [payload.new as Order, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate('/admin');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setProducts(data || []);
      } else {
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalData = {
        ...productForm,
        colors: colorsInput.split(',').map(s => s.trim()).filter(Boolean),
        fabrics: fabricsInput.split(',').map(s => s.trim()).filter(Boolean),
        images: imageUrlInput ? [imageUrlInput] : productForm.images
      };

      if (editingProduct) {
        await supabase.from('products').update(finalData).eq('id', editingProduct.id);
      } else {
        await supabase.from('products').insert([finalData]);
      }
      setIsProductModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm("Excluir este produto?")) {
      await supabase.from('products').delete().eq('id', id);
      fetchData();
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      await updateSettings(settingsForm);
      setIsSettingsModalOpen(false);
    } catch (err) {
      alert("Erro ao salvar configurações");
    } finally {
      setSettingsLoading(false);
    }
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm(p);
    setColorsInput(p.colors.join(', '));
    setFabricsInput(p.fabrics.join(', '));
    setImageUrlInput(p.images[0] || '');
    setIsProductModalOpen(true);
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: '', description: '', category: 'sofa', price: 0, colors: [], fabrics: [], dimensions: '', images: [], active: true });
    setColorsInput('');
    setFabricsInput('');
    setImageUrlInput('');
    setIsProductModalOpen(true);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesName = (order.customer_name || '').toLowerCase().includes(orderSearch.toLowerCase());
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      const matchesDate = orderDateFilter ? orderDate === orderDateFilter : true;
      return matchesName && matchesDate;
    });
  }, [orders, orderSearch, orderDateFilter]);

  const formatCurrency = (value: any) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-200 pb-8">
          <div>
            <h1 className="text-3xl font-serif text-slate-900">Gestão Elite</h1>
            <p className="text-slate-500">Administrando <span className="font-bold text-brand-primary">{settings.store_name}</span></p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => { setSettingsForm(settings); setIsSettingsModalOpen(true); }} 
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:text-brand-primary transition-all font-medium"
            >
              <Settings className="w-5 h-5" /> Configurações
            </button>
            <button onClick={() => supabase.auth.signOut().then(() => navigate('/admin'))} className="p-3 text-slate-400 hover:text-red-500 transition-all">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex gap-8 border-b border-slate-200 mb-8">
          <button onClick={() => setActiveTab('products')} className={`pb-4 px-2 font-bold text-sm relative transition-all ${activeTab === 'products' ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}>
            Produtos {activeTab === 'products' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-primary rounded-t-full" />}
          </button>
          <button onClick={() => setActiveTab('orders')} className={`pb-4 px-2 font-bold text-sm relative transition-all ${activeTab === 'orders' ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}>
            Pedidos {activeTab === 'orders' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-primary rounded-t-full" />}
          </button>
        </div>

        {activeTab === 'products' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-serif">Catálogo de Produtos</h2>
               <button onClick={openNewProduct} className="bg-brand-secondary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg">
                 <Plus className="w-5 h-5" /> Novo Produto
               </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-brand-primary" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden group hover:shadow-xl transition-all">
                    <div className="h-48 relative">
                      <img src={product.images[0]} className="w-full h-full object-cover" alt={product.name} />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={() => openEditProduct(product)} className="p-2 bg-white/90 backdrop-blur-md rounded-lg text-slate-700 hover:text-brand-primary shadow-sm"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteProduct(product.id)} className="p-2 bg-white/90 backdrop-blur-md rounded-lg text-slate-700 hover:text-red-500 shadow-sm"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                      <p className="text-brand-primary font-black text-xl mb-4">{formatCurrency(product.price)}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="bg-slate-100 px-2 py-1 rounded uppercase font-bold">{product.category}</span>
                        <span>{product.colors.length} Cores</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex-grow relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" placeholder="Buscar cliente..." className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} />
              </div>
              <input type="date" className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={orderDateFilter} onChange={e => setOrderDateFilter(e.target.value)} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Data</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Cliente</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Cidade</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Total</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm">{new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 font-bold">{order.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{order.customer_city}</td>
                      <td className="px-6 py-4 font-black">{formatCurrency(order.total_price)}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setSelectedOrder(order)} className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"><Eye className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && <div className="py-20 text-center text-slate-400">Nenhum pedido encontrado.</div>}
            </div>
          </div>
        )}
      </div>

      {/* Modal PRODUTO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-serif">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-8 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-slate-400">Nome do Produto</label>
                  <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Preço (R$)</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400">Categoria</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value as any})}>
                    <option value="sofa">Sofá</option><option value="poltrona">Poltrona</option><option value="chaise">Chaise</option><option value="puff">Puff</option><option value="cama">Cama</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-slate-400">URL da Imagem</label>
                  <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} placeholder="https://..." />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-slate-400">Cores (separadas por vírgula)</label>
                  <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={colorsInput} onChange={e => setColorsInput(e.target.value)} placeholder="Bege, Cinza, Azul..." />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-slate-400">Tecidos (separados por vírgula)</label>
                  <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl" value={fabricsInput} onChange={e => setFabricsInput(e.target.value)} placeholder="Linho, Veludo, Suede..." />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase text-slate-400">Descrição</label>
                  <textarea className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl min-h-[100px]" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                </div>
              </div>
              <button disabled={saving} className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Produto</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal SETTINGS */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-serif">Configurações da Loja</h2>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSettingsSubmit} className="p-8 space-y-8 overflow-y-auto">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest border-b border-slate-100 pb-2">Informações Gerais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Nome da Loja</label>
                    <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" value={settingsForm.store_name} onChange={e => setSettingsForm({...settingsForm, store_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">E-mail de Contato</label>
                    <input type="email" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" value={settingsForm.contact_email} onChange={e => setSettingsForm({...settingsForm, contact_email: e.target.value})} />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400">WhatsApp para Receber Pedidos (DDD + Número)</label>
                    <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" value={settingsForm.whatsapp_number} onChange={e => setSettingsForm({...settingsForm, whatsapp_number: e.target.value})} placeholder="Ex: 21999999999" />
                    <p className="text-[10px] text-slate-400 mt-1">Este é o número que receberá as mensagens de orçamento via WhatsApp.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">Cor Primária</label>
                      <input type="color" className="w-full h-10 border-0 rounded-xl cursor-pointer" value={settingsForm.primary_color} onChange={e => setSettingsForm({...settingsForm, primary_color: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">Cor Secundária</label>
                      <input type="color" className="w-full h-10 border-0 rounded-xl cursor-pointer" value={settingsForm.secondary_color} onChange={e => setSettingsForm({...settingsForm, secondary_color: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest border-b border-slate-100 pb-2">Localização (Showroom)</h3>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Endereço Completo</label>
                  <textarea className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none min-h-[80px]" value={settingsForm.contact_address} onChange={e => setSettingsForm({...settingsForm, contact_address: e.target.value})} />
                </div>
              </div>

              {/* Horários */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest border-b border-slate-100 pb-2">Horário de Atendimento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Segunda a Sexta</label>
                    <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" placeholder="Ex: 09h às 18h" value={settingsForm.hours_mon_fri} onChange={e => setSettingsForm({...settingsForm, hours_mon_fri: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Sábado</label>
                    <input className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" placeholder="Ex: 09h às 13h" value={settingsForm.hours_sat} onChange={e => setSettingsForm({...settingsForm, hours_sat: e.target.value})} />
                  </div>
                </div>
              </div>

              <button disabled={settingsLoading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
                {settingsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Todas as Configurações</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detalhes do Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-2xl font-serif">Pedido #{selectedOrder.id.slice(0, 5)}</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div><p className="text-xs font-bold text-slate-400 uppercase">Cliente</p><p className="font-bold text-xl">{selectedOrder.customer_name}</p></div>
                <div><p className="text-xs font-bold text-slate-400 uppercase">WhatsApp</p><p className="font-bold text-brand-primary text-xl">{selectedOrder.customer_phone}</p></div>
                <div className="md:col-span-1">
                  <p className="text-xs font-bold text-slate-400 uppercase">Realizado em</p>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{new Date(selectedOrder.created_at).toLocaleDateString('pt-BR')}</span>
                    <span className="text-sm text-slate-500">{new Date(selectedOrder.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                {selectedOrder.customer_city && (
                  <div className="col-span-2 md:col-span-3 pt-2 border-t border-slate-50">
                    <p className="text-[10px] font-black uppercase text-slate-400">Cidade / Localização</p>
                    <p className="font-medium text-slate-600 flex items-center gap-2 mt-1">
                      <MapPin className="w-3.5 h-3.5" /> {selectedOrder.customer_city}
                    </p>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-4">Produtos</p>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-slate-200 pb-2 last:border-0">
                      <div><p className="font-bold">{item.name}</p><p className="text-[10px] text-slate-500">{item.selectedColor} • {item.selectedFabric} • x{item.quantity}</p></div>
                      <p className="font-black">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center pt-4">
                <div><p className="text-xs font-bold text-slate-400 uppercase">Total Geral</p><p className="text-4xl font-black text-slate-900">{formatCurrency(selectedOrder.total_price)}</p></div>
                <a href={`https://wa.me/${selectedOrder.customer_phone.replace(/\D/g, '')}`} target="_blank" className="bg-green-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><Phone className="w-5 h-5" /> Iniciar Conversa</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
