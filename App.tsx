
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Instagram, Facebook } from 'lucide-react';
import { CartProvider, useCart } from './contexts/CartContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';

const ThemeManager = () => {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', settings.primary_color);
    root.style.setProperty('--brand-secondary', settings.secondary_color);
    
    // Calcula uma cor de hover simples (mais escura)
    // Para simplificar, usaremos a mesma cor com opacidade ou apenas a mesma cor
    root.style.setProperty('--brand-primary-hover', settings.primary_color + 'dd');
  }, [settings.primary_color, settings.secondary_color]);

  return null;
};

const Navbar = () => {
  const { totalItems } = useCart();
  const { settings } = useSettings();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const renderLogo = () => {
    const name = settings.store_name || 'ESTOFADOS ELITE';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      const firstPart = parts.slice(0, parts.length - 1).join(' ');
      const lastPart = parts[parts.length - 1];
      return (
        <span className="text-2xl font-serif text-slate-900 tracking-tight uppercase">
          {firstPart} <span className="text-brand-primary font-bold">{lastPart}</span>
        </span>
      );
    }
    return <span className="text-2xl font-serif text-slate-900 tracking-tight uppercase">{name}</span>;
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              {renderLogo()}
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`font-medium transition-colors ${isActive('/') ? 'text-brand-primary' : 'text-slate-600 hover:text-brand-primary'}`}>Catálogo</Link>
            <Link to="/sobre" className={`font-medium transition-colors ${isActive('/sobre') ? 'text-brand-primary' : 'text-slate-600 hover:text-brand-primary'}`}>Sobre Nós</Link>
            <Link to="/contato" className={`font-medium transition-colors ${isActive('/contato') ? 'text-brand-primary' : 'text-slate-600 hover:text-brand-primary'}`}>Contato</Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/checkout" className="relative p-2 text-slate-600 hover:text-brand-primary transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-brand-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </Link>
            <Link to="/admin" className="p-2 text-slate-600 hover:text-brand-primary transition-colors">
              <User className="w-6 h-6" />
            </Link>
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4">
          <Link to="/" className="block text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>Catálogo</Link>
          <Link to="/sobre" className="block text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>Sobre Nós</Link>
          <Link to="/contato" className="block text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>Contato</Link>
        </div>
      )}
    </nav>
  );
};

const Footer = () => {
  const { settings } = useSettings();
  return (
    <footer className="bg-brand-secondary text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-2xl font-serif mb-4 uppercase">{settings.store_name}</h3>
          <p className="text-slate-400 max-w-sm">
            Qualidade, conforto e design para transformar sua casa. Especialistas em estofados sob medida há mais de 15 anos.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4">Links</h4>
          <ul className="space-y-2 text-slate-400">
            <li><Link to="/">Catálogo</Link></li>
            <li><Link to="/sobre">Sobre Nós</Link></li>
            <li><Link to="/contato">Contato</Link></li>
            <li><Link to="/admin">Área Administrativa</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Redes Sociais</h4>
          <div className="flex space-x-4">
            <Instagram className="w-6 h-6 text-slate-400 hover:text-white cursor-pointer" />
            <Facebook className="w-6 h-6 text-slate-400 hover:text-white cursor-pointer" />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} {settings.store_name}. Todos os direitos reservados.
      </div>
    </footer>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <ThemeManager />
      <CartProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Catalog />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/sobre" element={<AboutUs />} />
                <Route path="/contato" element={<Contact />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </SettingsProvider>
  );
};

export default App;
