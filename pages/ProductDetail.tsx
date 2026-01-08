
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Ruler, Palette, Layers, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState('');
  const [fabric, setFabric] = useState('');

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setProduct(data);
        if (data.colors.length > 0) setColor(data.colors[0]);
        if (data.fabrics.length > 0) setFabric(data.fabrics[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center">Carregando detalhes...</div>;
  if (!product) return <div className="h-screen flex items-center justify-center">Produto não encontrado.</div>;

  const handleAddToCart = () => {
    addToCart(product, quantity, color, fabric);
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-slate-500 hover:text-brand-primary mb-8 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Voltar ao catálogo
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200">
            <img 
              src={product.images[selectedImage]} 
              className="w-full h-full object-cover" 
              alt={product.name} 
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  selectedImage === idx ? 'border-brand-primary shadow-md' : 'border-transparent'
                }`}
              >
                <img src={img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="mb-8">
            <span className="text-brand-primary font-bold uppercase tracking-wider text-sm">{product.category}</span>
            <h1 className="text-4xl font-serif text-slate-900 mt-2 mb-4">{product.name}</h1>
            <p className="text-3xl font-bold text-slate-900">
              {product.price > 0 
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)
                : 'Preço sob consulta'}
            </p>
          </div>

          <p className="text-slate-600 leading-relaxed mb-8">{product.description}</p>

          <div className="space-y-6 mb-10">
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <Ruler className="w-6 h-6 text-brand-primary shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Dimensões</h4>
                <p className="text-slate-500 text-sm">{product.dimensions}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 font-bold text-slate-900 mb-3 text-sm">
                  <Palette className="w-4 h-4 text-brand-primary" /> Cores Disponíveis
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        color === c 
                        ? 'bg-brand-secondary text-white border-brand-secondary shadow-md' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-brand-primary'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 font-bold text-slate-900 mb-3 text-sm">
                  <Layers className="w-4 h-4 text-brand-primary" /> Tecidos
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.fabrics.map(f => (
                    <button
                      key={f}
                      onClick={() => setFabric(f)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        fabric === f 
                        ? 'bg-brand-secondary text-white border-brand-secondary shadow-md' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-brand-primary'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
              <button 
                className="px-4 py-2 hover:text-brand-primary font-bold"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >-</button>
              <span className="w-12 text-center font-bold">{quantity}</span>
              <button 
                className="px-4 py-2 hover:text-brand-primary font-bold"
                onClick={() => setQuantity(quantity + 1)}
              >+</button>
            </div>
            
            <button 
              onClick={handleAddToCart}
              className="flex-grow flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg w-full sm:w-auto"
            >
              <ShoppingCart className="w-5 h-5" />
              Adicionar ao Orçamento
            </button>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
            <MessageCircle className="w-4 h-4" />
            O pedido será finalizado via WhatsApp
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
