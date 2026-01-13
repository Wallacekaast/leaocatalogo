
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, ArrowRight, Package, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Category } from '../types';

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Sofás', value: 'sofa' },
  { label: 'Poltronas', value: 'poltrona' },
  { label: 'Chaises', value: 'chaise' },
  { label: 'Puffs', value: 'puff' },
  { label: 'Camas', value: 'cama' },
];

const Catalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('todos');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'newest'>('newest');

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('active', true);
        
        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => 
        (category === 'todos' || p.category === category) &&
        (p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => {
        // Primeiro critério: Destaque (is_featured)
        const aFeatured = a.is_featured ? 1 : 0;
        const bFeatured = b.is_featured ? 1 : 0;
        
        if (aFeatured !== bFeatured) {
          return bFeatured - aFeatured; // Destaques primeiro
        }

        // Segundo critério: Ordenação selecionada pelo usuário
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [products, search, category, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-serif text-slate-900 mb-4">Nosso Catálogo</h1>
        <p className="text-slate-600 text-lg max-w-2xl">
          Peças exclusivas desenhadas para o seu conforto. Escolha entre uma variedade de tecidos, cores e tamanhos.
        </p>
      </div>

      <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200 rounded-2xl p-6 mb-12 flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          <input 
            type="text"
            placeholder="Buscar por nome ou descrição..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap justify-center lg:justify-start gap-2 w-full lg:w-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                category === cat.value 
                ? 'bg-brand-primary text-white shadow-lg' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="w-full lg:w-auto">
          <select 
            className="w-full lg:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer transition-all"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="newest">Mais recentes</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1,2,3,4].map(n => (
            <div key={n} className="animate-pulse bg-white rounded-3xl p-4 border border-slate-200 h-[420px]">
              <div className="bg-slate-200 h-64 rounded-2xl mb-6"></div>
              <div className="h-6 bg-slate-200 rounded-lg w-3/4 mb-4"></div>
              <div className="h-4 bg-slate-200 rounded-lg w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <Link 
              key={product.id} 
              to={`/product/${product.id}`}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative"
            >
              <div className="relative h-72 overflow-hidden">
                {product.is_featured && (
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                    <Star className="w-3 h-3 fill-white" /> Destaque
                  </div>
                )}
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4">
                  <span className="bg-white/95 backdrop-blur-sm text-brand-primary px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm uppercase tracking-widest border border-brand-primary/10">
                    {product.category}
                  </span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-primary transition-colors">{product.name}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-6 min-h-[40px] leading-relaxed">{product.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-2xl font-black text-slate-900">
                    {product.price > 0 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)
                      : 'Sob consulta'}
                  </span>
                  <div className="bg-brand-secondary text-white p-3 rounded-2xl group-hover:bg-brand-primary group-hover:rotate-45 transition-all duration-500">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
          <Package className="w-20 h-20 text-slate-200 mx-auto mb-6" />
          <h3 className="text-2xl font-serif text-slate-900 mb-2">Nenhum produto encontrado</h3>
          <p className="text-slate-500 text-sm">Tente ajustar seus filtros ou termos de busca.</p>
          <button 
            onClick={() => {setSearch(''); setCategory('todos');}} 
            className="mt-8 text-brand-primary font-bold hover:underline"
          >
            Limpar todos os filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default Catalog;
