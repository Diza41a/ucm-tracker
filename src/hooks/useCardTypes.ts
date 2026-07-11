import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';
import type { CardType } from '@/src/types';

export const cardTypeKeys = {
  all: ['cardTypes'] as const,
};

export type CardTypeInput = {
  name: string;
  bg_color: string;
  text_color: string;
};

export function useCardTypes() {
  return useQuery({
    queryKey: cardTypeKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('card_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as CardType[];
    },
  });
}

export function useCreateCardType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CardTypeInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('card_types')
        .insert({ user_id: user.id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data as CardType;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardTypeKeys.all }),
  });
}

export function useUpdateCardType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CardTypeInput & { id: string }) => {
      const { id, ...payload } = input;
      const { data, error } = await supabase
        .from('card_types')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CardType;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardTypeKeys.all }),
  });
}

export function useDeleteCardType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countError } = await supabase
        .from('cards')
        .select('id', { count: 'exact', head: true })
        .eq('card_type_id', id);

      if (countError) throw countError;
      if (count && count > 0) {
        throw new Error(
          `This type is used by ${count} card${count === 1 ? '' : 's'}. Delete or reassign those cards first.`
        );
      }

      const { error } = await supabase.from('card_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardTypeKeys.all }),
  });
}
