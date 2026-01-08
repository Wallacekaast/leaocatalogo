
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AppSettings } from '../types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  loading: boolean;
}

const defaultSettings: AppSettings = {
  id: 'global',
  store_name: 'ESTOFADOS ELITE',
  whatsapp_number: '21965091676',
  contact_email: 'contato@estofadoselite.com.br',
  contact_address: 'Av. das Américas, 4200 - Barra da Tijuca, Rio de Janeiro - RJ',
  hours_mon_fri: '09h às 18h',
  hours_sat: '09h às 13h',
  primary_color: '#d97706', // amber-600
  secondary_color: '#0f172a', // slate-900
  updated_at: new Date().toISOString()
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      // Tentamos buscar, se falhar por falta de coluna, o catch assume os valores padrão
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .single();
      
      if (data) {
        // Fazemos um merge com os padrões para garantir que campos novos 
        // (que podem ser nulos no banco) tenham valores válidos no app
        setSettings({
          ...defaultSettings,
          ...data
        });
      } else if (error && error.code === 'PGRST116') {
        // Se o registro não existe, tentamos criar
        const { data: newData } = await supabase
          .from('settings')
          .insert([defaultSettings])
          .select()
          .single();
        if (newData) setSettings(newData);
      }
    } catch (err) {
      console.warn("Aviso: Algumas colunas de configuração podem estar ausentes no banco. Usando padrões locais.", err);
      // Mantém os defaultSettings
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const payload = {
      ...settings,
      ...newSettings,
      id: 'global',
      updated_at: new Date().toISOString()
    };
    
    if (payload.whatsapp_number) {
      payload.whatsapp_number = payload.whatsapp_number.replace(/\D/g, '');
    }

    const { error } = await supabase
      .from('settings')
      .upsert(payload);
    
    if (error) {
      console.error("Erro ao fazer upsert em settings:", error);
      throw new Error(`Erro ao salvar: ${error.message}. Certifique-se de que as colunas existem no banco de dados.`);
    }

    setSettings(payload);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings deve ser usado dentro de um SettingsProvider");
  return context;
};
