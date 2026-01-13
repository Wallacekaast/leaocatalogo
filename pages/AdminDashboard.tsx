
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, LogOut, Settings, Save, AlertCircle, X, 
  Phone, Upload, Image as ImageIcon, Loader2, Layers, Palette, 
  Ruler, Tag, Mail, MapPin, Clock, ShoppingBag, Eye, Calendar, 
  User as UserIcon, RefreshCw, CheckCircle, Hash, Search, Filter,
  ChevronRight, Star
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
    active: true,
    is_featured: false
  });

  const [colorsInput, setColorsInput] = useState('');
  const [fabricsInput, setFabricsInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  useEffect(() => {
    checkAuth();
    fetchData();

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
    if (saving) return;
    
    setSaving(true);
    try {
      // Extraímos apenas os campos que queremos salvar, ignorando campos automáticos do banco
      const finalData = {
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        price: Number(productForm.price) || 0,
        colors: colorsInput.split(',').map(s => s.trim()).filter(Boolean),
        fabrics: fabricsInput.split(',').map(s => s.trim()).filter(Boolean),
        dimensions: productForm.dimensions || '',
        images: imageUrlInput ? [imageUrlInput] : (productForm.images || []),
        active: productForm.active !== undefined ? productForm.active : true,
        is_featured: Boolean(productForm.is_featured) // Garante que é booleano
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(finalData)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([finalData]);
        
        if (error) throw error;
      }
      
      setIsProductModalOpen(false);
      fetchData();
      alert("Produto salvo com sucesso!");
    } catch (err: any) {
      console.error("Erro detalhado:", err);
      if (err.code === 'PGRST204') {
        alert("ERRO DE BANCO: A coluna 'is_featured' não foi encontrada. Você precisa executar o comando SQL no Supabase para criar essa coluna antes de usar esta função.");
      } else {
        alert(`Erro ao salvar: ${err.message || 'Erro desconhecido'}`);
      }
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
      alert("Configurações atualizadas!");
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setSettingsLoading(false);
    }
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      colors: p.colors,
      fabrics: p.fabrics,
      dimensions: p.dimensions,
      images: p.images,
      active: p.active,
      is_featured: !!p.is_featured
    });
    setColorsInput(p.colors.join(', '));
    setFabricsInput(p.fabrics.join(', '));
    setImageUrlInput(p.images[0] || '');
    setIsProductModalOpen(true);
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm({ 
      name: '', 
      description: '', 
      category: 'sofa', 
      price: 0, 
      colors: [], 
      fabrics: [], 
      dimensions: '', 
      images: [], 
      active: true, 
      is_featured: false 
    });
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
                  <div key={product.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden group hover:shadow-xl transition-all relative">
                    {product.is_featured && (
                      <div className="absolute top-4 left-4 z-10 bg-amber-500 text-white p-1.5 rounded-full shadow-lg border border-amber-400">
                        <Star className="w-4 h-4 fill-white text-white" />
                      </div>
                    )}
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
                        {product.is_featured && <span className="text-amber-600 font-bold ml-auto flex items-center gap-1"><Star className="w-3 h-3 fill-amber-600" /> Destaque</span>}
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
            </div>
          </div>
        )}
      </div>

      {/* Modal PRODUTO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-serif">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="flex items-center gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-2 transition-all hover:bg-amber-100/50">
                    <input 
                      type="checkbox" 
                      id="is_featured"
                      className="w-6 h-6 accent-amber-600 rounded-lg cursor-pointer transition-transform active:scale-90" 
                      checked={!!productForm.is_featured} 
                      onChange={e => setProductForm({...productForm, is_featured: e.target.checked})} 
                    />
                    <label htmlFor="is_featured" className="text-sm font-bold text-amber-900 cursor-pointer flex items-center gap-2 select-none">
                      <Star className={`w-5 h-5 ${productForm.is_featured ? 'fill-amber-600 text-amber-600' : 'text-amber-400'}`} /> 
                      Marcar como Produto em Destaque (Fica no topo do Catálogo)
                    </label>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Nome do Produto</label>
                  <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary transition-all" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                </div>
                
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Preço (R$)</label>
                  <input type="number" step="0.01" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                </div>
                
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Categoria</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value as any})}>
                    <option value="sofa">Sofá</option><option value="poltrona">Poltrona</option><option value="chaise">Chaise</option><option value="puff">Puff</option><option value="cama">Cama</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">URL da Imagem</label>
                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary" value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} placeholder="https://..." />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Cores (separadas por vírgula)</label>
                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary" value={colorsInput} onChange={e => setColorsInput(e.target.value)} placeholder="Bege, Cinza, Azul..." />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Tecidos (separados por vírgula)</label>
                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary" value={fabricsInput} onChange={e => setFabricsInput(e.target.value)} placeholder="Linho, Veludo, Suede..." />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Descrição</label>
                  <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary min-h-[100px]" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                </div>
              </div>
              
              <button disabled={saving} className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> Salvar Alterações</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal SETTINGS e ORDER omitidos para brevidade, permanecem iguais */}
    </div>
  );
};

export default AdminDashboard;
