import { IconButton } from '@/src/components/ui/IconButton';

interface SaveButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

export function SaveButton({
  onPress,
  disabled,
  loading,
  label = 'Save',
}: SaveButtonProps) {
  return (
    <IconButton
      icon="save-outline"
      label={loading ? 'Saving…' : label}
      variant="primary"
      onPress={onPress}
      disabled={disabled || loading}
    />
  );
}
