
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

interface SupabaseContextType {
  supabase: SupabaseClient;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

export const SupabaseProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <SupabaseContext.Provider value={{ supabase }}>
        {children}
      </SupabaseContext.Provider>
    </SessionContextProvider>
  );
};
