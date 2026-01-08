
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, LogOut, Settings, Save, AlertCircle, X, 
  Phone, Upload, Image as ImageIcon, Loader2, Layers, Palette, 
  Ruler, Tag, Mail, MapPin, Clock, ShoppingBag, Eye, Calendar, 
  User as UserIcon, RefreshCw, CheckCircle, Hash, Search, Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, AppSettings, Order } from '../types';
import { useSettings } from '../contexts/SettingsContext';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { settings, updateSettings } = useSettings();
  
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Filtro para Pedidos
  const [orderSearch, setOrderSearch] = useState('');
  const [orderDateFilter, setOrderDateFilter] = useState('');
  
  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Estados de Upload e Config
  const [uploading, setUploading] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<AppSettings>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
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

  useEffect(() => {
    checkAuth();
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (isSettingsOpen) {
      setSettingsForm({
        store_name: settings.store_name,
        whatsapp_number: settings.whatsapp_number,
        contact_email: settings.contact_email,
        contact_address: settings.contact_address,
        hours_mon_fri: settings.hours_mon_fri,
        hours_sat: settings.hours_sat,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
      });
      setSettingsMessage(null);
    }
  }, [isSettingsOpen, settings]);

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

  // Helper para calcular o total real de um pedido somando seus itens
  const calculateOrderTotal = (order: Order) => {
    if (!order.items || !Array.isArray(order.items)) return Number(order.total_price) || 0;
    return order.items.reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0);
  };

  // Filtragem local de pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesName = order.customer_name.toLowerCase().includes(orderSearch.toLowerCase());
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      const matchesDate = orderDateFilter ? orderDate === orderDateFilter : true;
      return matchesName && matchesDate;
    });
  }, [orders, orderSearch, orderDateFilter]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      await updateSettings(settingsForm);
      setSettingsMessage({ type: 'success', text: 'Configurações atualizadas!' });
      setTimeout(() => setIsSettingsOpen(false), 1500);
    } catch (err: any) {
      setSettingsMessage({ type: 'error', text: err.message });
    } finally {
      setSettingsLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm("Excluir este produto permanentemente?")) {
      await supabase.from('products').delete().eq('id', id);
      fetchData();
    }
  };

  const deleteOrder = async (id: string) => {
    if (confirm("Deseja excluir este registro de pedido permanentemente do sistema?")) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) {
        alert("Erro ao excluir pedido: " + error.message);
      } else {
        setOrders(prev => prev.filter(o => o.id !== id));
      }
    }
  };

  const openProductModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
      setColorsInput(product.colors.join(', '));
      setFabricsInput(product.fabrics.join(', '));
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', category: 'sofa', price: 0, colors: [], fabrics: [], dimensions: '', images: [], active: true });
      setColorsInput('');
      setFabricsInput('');
    }
    setIsModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const productData = {
        ...formData,
        colors: colorsInput.split(',').map(s => s.trim()).filter(s => s !== ''),
        fabrics: fabricsInput.split(',').map(s => s.trim()).filter(s => s !== ''),
        images: formData.images?.length ? formData.images : ['https://picsum.photos/800/600']
      };

      if (editingProduct) {
        await supabase.from('products').update(productData).eq('id', editingProduct.id);
      } else {
        await supabase.from('products').insert([productData]);
      }
      setIsModalOpen(false);
      fetchData();
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (value: any) => {
    const num = Number(value);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(num) ? 0 : num);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-200 pb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-serif text-slate-900">Gestão Administrativa</h1>
            <p className="text-slate-500">Administrando <span className="font-bold text-brand-primary">{settings.store_name}</span></p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-white text-slate-600 hover:text-brand-primary border border-slate-200 rounded-xl flex items-center gap-2 transition-all shadow-sm"><Settings className="w-5 h-5" /> Ajustes</button>
            <button onClick={handleLogout} className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><LogOut className="w-6 h-6" /></button>
          </div>
        </div>

        {/* Tabs e Ações Rápidas */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 mb-8 gap-4">
          <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('products')}
              className={`pb-4 px-2 font-bold text-sm transition-all whitespace-nowrap relative ${activeTab === 'products' ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Catálogo de Produtos
              {activeTab === 'products' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-primary rounded-t-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`pb-4 px-2 font-bold text-sm transition-all whitespace-nowrap relative ${activeTab === 'orders' ? 'text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Pedidos & Orçamentos
              {activeTab === 'orders' && <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-primary rounded-t-full" />}
            </button>
          </div>
          
          <div className="pb-4 flex gap-2">
            {activeTab === 'products' ? (
              <button onClick={() => openProductModal()} className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all text-sm w-full md:w-auto justify-center"><Plus className="w-4 h-4" /> Novo Produto</button>
            ) : (
              <button onClick={fetchData} className="text-brand-primary hover:bg-brand-primary/5 font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all text-sm border border-brand-primary/20 w-full md:w-auto justify-center"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sincronizar</button>
            )}
          </div>
        </div>

        {activeTab === 'products' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Produto</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Preço</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Status</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-4">
                        <img src={product.images[0]} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                        <div>
                          <p className="font-bold text-slate-900">{product.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{product.category}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4">
                        {product.active ? 
                          <span className="text-[10px] font-black uppercase tracking-tighter text-green-600 bg-green-50 px-2 py-1 rounded-md">Ativo</span> : 
                          <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 bg-slate-100 px-2 py-1 rounded-md">Inativo</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => openProductModal(product)} className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteProduct(product.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-black text-slate-400 uppercase mb-1">Total de Pedidos</p>
                  <p className="text-3xl font-serif text-slate-900">{filteredOrders.length}</p>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-black text-slate-400 uppercase mb-1">Valor Filtrado</p>
                  <p className="text-3xl font-serif text-brand-primary">
                    {formatCurrency(filteredOrders.reduce((acc, o) => acc + calculateOrderTotal(o), 0))}
                  </p>
               </div>
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-black text-slate-400 uppercase mb-1">Canal de Origem</p>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-bold text-slate-700">WhatsApp</span>
                  </div>
               </div>
            </div>

            {/* Barra de Busca e Filtros para Pedidos */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex-grow relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Buscar pelo nome do cliente..." 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
              <div className="md:w-64 relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="date" 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                  value={orderDateFilter}
                  onChange={(e) => setOrderDateFilter(e.target.value)}
                />
              </div>
              {(orderSearch || orderDateFilter) && (
                <button 
                  onClick={() => { setOrderSearch(''); setOrderDateFilter(''); }}
                  className="px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all text-sm"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Data e Hora</th>
                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Cliente</th>
                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Localização</th>
                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">Total</th>
                        <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.length > 0 ? filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{order.customer_name}</span>
                              <span className="text-[10px] text-slate-400 font-bold text-brand-primary">{order.customer_phone}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">{order.customer_city || '---'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-black text-slate-900">{formatCurrency(calculateOrderTotal(order))}</span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
                              title="Ver Detalhes"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => deleteOrder(order.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Excluir Pedido"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-24 text-center">
                            <ShoppingBag className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                            <p className="text-slate-400 font-medium">Nenhum pedido encontrado com estes filtros.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detalhes do Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <h2 className="text-2xl font-serif text-slate-900">Resumo do Pedido</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] bg-brand-primary/10 text-brand-primary font-black uppercase tracking-widest px-2 py-1 rounded">WhatsApp</span>
                  <span className="text-[10px] text-slate-400 font-bold"># {selectedOrder.id.slice(0,8).toUpperCase()}</span>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-10">
              {/* Infos do Cliente */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><UserIcon className="w-3 h-3" /> Cliente</label>
                  <p className="font-bold text-slate-900 text-lg">{selectedOrder.customer_name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Phone className="w-3 h-3" /> WhatsApp</label>
                  <p className="font-bold text-brand-primary text-lg">{selectedOrder.customer_phone}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Localização</label>
                  <p className="font-bold text-slate-900">{selectedOrder.customer_city || 'Não informado'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Realizado em</label>
                  <p className="font-bold text-slate-900">{new Date(selectedOrder.created_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {/* Tabela de Itens */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5"><ShoppingBag className="w-3 h-3" /> Itens do Orçamento</label>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-brand-primary/20 transition-all">
                      <img src={item.images[0]} className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-sm" />
                      <div className="flex-grow flex flex-col justify-center">
                        <h4 className="font-bold text-slate-900">{item.name}</h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                          <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase"><Palette className="w-2.5 h-2.5" /> {item.selectedColor || 'N/A'}</span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase"><Layers className="w-2.5 h-2.5" /> {item.selectedFabric || 'N/A'}</span>
                          <span className="flex items-center gap-1 text-[10px] text-brand-primary font-black uppercase"><Hash className="w-2.5 h-2.5" /> Qtd: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col justify-center">
                        <p className="font-black text-slate-900">{formatCurrency(Number(item.price) * (item.quantity || 1))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="space-y-2 p-5 bg-amber-50 rounded-2xl border border-amber-100">
                   <label className="text-[10px] font-black uppercase text-amber-600">Observações Adicionais</label>
                   <p className="text-sm text-slate-700 italic leading-relaxed">"{selectedOrder.notes}"</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-900 flex justify-between items-center text-white">
              <div>
                <span className="text-[10px] font-black uppercase opacity-60 tracking-widest block mb-1">Valor Total do Pedido</span>
                <span className="text-3xl font-black text-brand-primary">{formatCurrency(calculateOrderTotal(selectedOrder))}</span>
              </div>
              <a 
                href={`https://wa.me/${selectedOrder.customer_phone.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <Phone className="w-5 h-5" /> Responder
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo/Editar Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl my-8" onClick={e => e.stopPropagation()}>
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-serif text-slate-900">{editingProduct ? 'Editar' : 'Novo'} Produto</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleProductSubmit} className="p-6 md:p-8 space-y-8 max-h-[80vh] overflow-y-auto">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Tag className="w-4 h-4 text-brand-primary" /> Nome do Produto</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" placeholder="Ex: Sofá Retrátil Madri" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Preço (R$)</label>
                      <input type="number" step="0.01" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Categoria</label>
                      <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none capitalize" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                        <option value="sofa">Sofá</option>
                        <option value="poltrona">Poltrona</option>
                        <option value="chaise">Chaise</option>
                        <option value="puff">Puff</option>
                        <option value="cama">Cama</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Descrição</label>
                    <textarea required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none min-h-[120px]" placeholder="Descreva os diferenciais do produto..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Ruler className="w-4 h-4 text-brand-primary" /> Dimensões</label>
                    <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" placeholder="Ex: 2.30m x 1.10m" value={formData.dimensions} onChange={e => setFormData({...formData, dimensions: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Palette className="w-4 h-4 text-brand-primary" /> Cores (separadas por vírgula)</label>
                    <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" placeholder="Cinza, Bege, Marrom" value={colorsInput} onChange={e => setColorsInput(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><Layers className="w-4 h-4 text-brand-primary" /> Tecidos (separadas por vírgula)</label>
                    <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" placeholder="Linho, Veludo, Suede" value={fabricsInput} onChange={e => setFabricsInput(e.target.value)} />
                  </div>

                  <div className="pt-4 flex items-center gap-3">
                    <input type="checkbox" id="active-check" className="w-5 h-5 rounded accent-brand-primary" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} />
                    <label htmlFor="active-check" className="text-sm font-bold text-slate-700 cursor-pointer">Produto visível no catálogo</label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="flex-[2] px-6 py-4 bg-brand-primary text-white font-bold rounded-2xl hover:bg-brand-primary-hover shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Settings */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 my-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-serif text-slate-900">Ajustes da Loja</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {settingsMessage && (
                <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${settingsMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <AlertCircle className="w-5 h-5" /> {settingsMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400">Nome da Empresa</label>
                  <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" value={settingsForm.store_name} onChange={e => setSettingsForm({...settingsForm, store_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400">WhatsApp Oficial</label>
                  <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" value={settingsForm.whatsapp_number} onChange={e => setSettingsForm({...settingsForm, whatsapp_number: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">E-mail de Contato</label>
                <input required type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" value={settingsForm.contact_email} onChange={e => setSettingsForm({...settingsForm, contact_email: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">Endereço Showroom</label>
                <textarea required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none min-h-[80px]" value={settingsForm.contact_address} onChange={e => setSettingsForm({...settingsForm, contact_address: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400">Cor Primária</label>
                  <div className="flex items-center gap-3">
                    <input type="color" className="w-10 h-10 rounded-lg border-2 border-white shadow-sm cursor-pointer" value={settingsForm.primary_color} onChange={e => setSettingsForm({...settingsForm, primary_color: e.target.value})} />
                    <input className="flex-grow px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono" value={settingsForm.primary_color} onChange={e => setSettingsForm({...settingsForm, primary_color: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400">Cor Secundária</label>
                  <div className="flex items-center gap-3">
                    <input type="color" className="w-10 h-10 rounded-lg border-2 border-white shadow-sm cursor-pointer" value={settingsForm.secondary_color} onChange={e => setSettingsForm({...settingsForm, secondary_color: e.target.value})} />
                    <input className="flex-grow px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono" value={settingsForm.secondary_color} onChange={e => setSettingsForm({...settingsForm, secondary_color: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsSettingsOpen(false)} className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancelar</button>
                <button type="submit" disabled={settingsLoading} className="flex-[2] py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {settingsLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                  Atualizar Dados da Loja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
