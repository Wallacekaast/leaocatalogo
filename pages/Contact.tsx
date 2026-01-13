
import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const Contact: React.FC = () => {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Tratamento do número
    let cleanNumber = settings.whatsapp_number.replace(/\D/g, '');
    if (cleanNumber.length <= 11 && !cleanNumber.startsWith('55')) {
      cleanNumber = '55' + cleanNumber;
    }

    const text = `Olá, meu nome é ${formData.name}. Assunto: ${formData.subject}. Mensagem: ${formData.message}`;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const formatPhone = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return num;
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif text-slate-900 mb-4">Entre em Contato</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Tem alguma dúvida sobre nossos produtos ou quer um orçamento personalizado? Estamos à disposição para ajudar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info Cards */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Telefone / WhatsApp</h4>
                <p className="text-slate-600 text-sm">{formatPhone(settings.whatsapp_number)}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">E-mail</h4>
                <p className="text-slate-600 text-sm">{settings.contact_email}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Showroom</h4>
                <p className="text-slate-600 text-sm">{settings.contact_address}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Horário de Atendimento</h4>
                <p className="text-slate-600 text-sm">
                  Segunda a Sexta: {settings.hours_mon_fri}<br />
                  Sábado: {settings.hours_sat}
                </p>
              </div>
            </div>

            <button 
              onClick={() => {
                let cleanNumber = settings.whatsapp_number.replace(/\D/g, '');
                if (cleanNumber.length <= 11 && !cleanNumber.startsWith('55')) cleanNumber = '55' + cleanNumber;
                window.open(`https://wa.me/${cleanNumber}`, '_blank');
              }}
              className="flex items-center justify-center gap-3 w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg transition-all"
            >
              <MessageCircle className="w-6 h-6" />
              Falar agora no WhatsApp
            </button>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-2xl font-serif text-slate-900 mb-8">Envie uma mensagem</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Seu Nome</label>
                  <input 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    placeholder="Como podemos te chamar?"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Seu E-mail</label>
                  <input 
                    required
                    type="email"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700">Assunto</label>
                  <input 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    placeholder="Ex: Orçamento Sob Medida"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700">Mensagem</label>
                  <textarea 
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all min-h-[150px]"
                    placeholder="Descreva seu projeto ou dúvida..."
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <button 
                    type="submit"
                    className="w-full md:w-auto px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl"
                  >
                    <Send className="w-5 h-5" />
                    Enviar Mensagem
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
