import { colors } from '@/src/constants/theme';

export type RichTextToolbarAction =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'h1'
  | 'h2'
  | 'insertHorizontalRule'
  | 'removeFormat'
  | 'undo'
  | 'redo'
  | 'link';

export const richTextTextColors = [
  { label: 'Default', value: colors.text },
  { label: 'Primary', value: colors.primaryLight },
  { label: 'Success', value: colors.success },
  { label: 'Warning', value: colors.warning },
  { label: 'Danger', value: colors.danger },
  { label: 'Muted', value: colors.textSecondary },
] as const;

export const richTextHighlightColors = [
  { label: 'None', value: 'transparent' },
  { label: 'Primary', value: 'rgba(124, 131, 255, 0.35)' },
  { label: 'Yellow', value: 'rgba(255, 208, 91, 0.45)' },
  { label: 'Green', value: 'rgba(61, 219, 156, 0.35)' },
  { label: 'Pink', value: 'rgba(255, 107, 122, 0.35)' },
  { label: 'Gray', value: 'rgba(139, 155, 180, 0.35)' },
] as const;

export const richTextEditorStyles = `
  a {
    color: ${colors.primaryLight};
    text-decoration: underline;
  }
  hr {
    border: none;
    border-top: 1px solid ${colors.border};
    margin: 12px 0;
  }
  mark {
    border-radius: 3px;
    padding: 0 2px;
  }
`;
