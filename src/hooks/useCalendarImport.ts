
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';

interface CalendarImport {
  id: string;
  calendar_url: string;
  import_date: string;
  start_date: string;
}

export const useCalendarImport = () => {
  const user = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importDate, setImportDate] = useState<Date>(new Date());

  const { data: imports, isLoading } = useQuery({
    queryKey: ['calendar-imports'],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('calendar_imports')
        .select('*')
        .order('import_date', { ascending: false });

      if (error) {
        console.error('Error fetching calendar imports:', error);
        throw error;
      }

      return data as CalendarImport[];
    },
    enabled: !!user,
  });

  const importMutation = useMutation({
    mutationFn: async ({ calendarUrl, startDate }: { calendarUrl: string; startDate: Date }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('calendar_imports').insert({
        calendar_url: calendarUrl,
        start_date: startDate.toISOString(),
        user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-imports'] });
      toast({
        title: 'Succès',
        description: 'Le calendrier a été importé avec succès.',
      });
    },
    onError: (error) => {
      console.error('Error importing calendar:', error);
      toast({
        title: 'Erreur',
        description: "Une erreur s'est produite lors de l'importation du calendrier.",
        variant: 'destructive',
      });
    },
  });

  return {
    imports,
    isLoading,
    importDate,
    setImportDate,
    importCalendar: importMutation.mutate,
    isImporting: importMutation.isPending,
  };
};
