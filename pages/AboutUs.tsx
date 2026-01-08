
import React from 'react';
import { CheckCircle2, Award, Users, Heart } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const AboutUs: React.FC = () => {
  const { settings } = useSettings();

  const values = [
    {
      icon: <Award className="w-8 h-8 text-amber-600" />,
      title: "Qualidade Premium",
      description: "Utilizamos apenas as melhores madeiras, espumas de alta densidade e tecidos selecionados."
    },
    {
      icon: <Users className="w-8 h-8 text-amber-600" />,
      title: "Atendimento Humano",
      description: "Nossa equipe está pronta para entender sua necessidade e indicar o estofado perfeito."
    },
    {
      icon: <CheckCircle2 className="w-8 h-8 text-amber-600" />,
      title: "Sob Medida",
      description: "Fabricamos peças que se adaptam perfeitamente ao seu espaço e estilo de vida."
    },
    {
      icon: <Heart className="w-8 h-8 text-amber-600" />,
      title: "Conforto Garantido",
      description: "Cada curva e costura é pensada para proporcionar a melhor experiência de descanso."
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover" 
            alt="Fábrica de Estofados"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-serif mb-6">Tradição e Conforto</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Há mais de 15 anos transformando casas em lares através de estofados que combinam design sofisticado e conforto incomparável.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-amber-600 font-bold uppercase tracking-widest text-sm">Nossa História</span>
            <h2 className="text-3xl md:text-4xl font-serif text-slate-900 mt-4 mb-6">Como tudo começou</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                A <strong>{settings.store_name}</strong> nasceu do sonho de oferecer móveis de alta qualidade com um toque artesanal que as grandes indústrias perderam. Começamos em uma pequena oficina, focados na reforma e criação de peças exclusivas.
              </p>
              <p>
                Com o passar dos anos, nossa paixão pelo design e pelo bem-estar nos levou a expandir. Hoje, somos referência na região, entregando não apenas sofás, mas cenários de memórias felizes para milhares de famílias.
              </p>
              <p>
                Cada peça que sai de nossa fábrica carrega o selo de dedicação de nossos mestres estofadores, que cuidam de cada detalhe, desde a estrutura em madeira reflorestada até o acabamento final do tecido.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1556912177-f5c3362a21e0?auto=format&fit=crop&q=80" 
                className="w-full h-full object-cover" 
                alt="Processo de fabricação"
              />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-amber-600 text-white p-8 rounded-2xl shadow-xl hidden md:block">
              <p className="text-4xl font-serif font-bold">15+</p>
              <p className="text-sm font-medium opacity-90">Anos de Experiência</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif text-slate-900 mb-4">Nossos Pilares</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Valores que guiam cada etapa da nossa produção e atendimento.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="mb-6">{value.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
