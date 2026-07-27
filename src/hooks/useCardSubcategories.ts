import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { CardSubcategory } from '@/src/types';

export const cardSubcategoryKeys = {
  all: ['cardSubcategories'] as const,
};

export function useCardSubcategories() {
  return useQuery({
    queryKey: cardSubcategoryKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('card_subcategories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as CardSubcategory[];
    },
  });
}

export function useCreateCardSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('card_subcategories')
        .insert({ user_id: user.id, name: input.name.trim() })
        .select()
        .single();
      if (error) throw error;
      return data as CardSubcategory;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardSubcategoryKeys.all }),
  });
}

export function useUpdateCardSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('card_subcategories')
        .update({ name: input.name.trim() })
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      return data as CardSubcategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardSubcategoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}

export function useDeleteCardSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countError } = await supabase
        .from('card_card_subcategories')
        .select('card_id', { count: 'exact', head: true })
        .eq('subcategory_id', id);

      if (countError) throw countError;
      if (count && count > 0) {
        throw new Error(
          `This subcategory is used by ${count} card${count === 1 ? '' : 's'}. Remove it from those cards first.`
        );
      }

      const { error } = await supabase.from('card_subcategories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardSubcategoryKeys.all }),
  });
}
