export function captureEditorSelection(editor: HTMLElement | null): Range | null {
  const selection = window.getSelection();
  if (!editor || !selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return null;

  return range.cloneRange();
}

export function restoreEditorSelection(range: Range | null): boolean {
  if (!range) return false;

  const selection = window.getSelection();
  if (!selection) return false;

  selection.removeAllRanges();
  selection.addRange(range);
  return true;
}

export function getRangeText(range: Range | null): string {
  return range?.toString() ?? '';
}
