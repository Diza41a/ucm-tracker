import { useCallback, useState } from 'react';

export function useRichTextEditorExpand(
  flushEditorContent: () => void | Promise<void>
) {
  const [expanded, setExpanded] = useState(false);

  const setExpandedWithFlush = useCallback(
    async (next: boolean) => {
      await flushEditorContent();
      setExpanded(next);
    },
    [flushEditorContent]
  );

  const toggleExpand = useCallback(async () => {
    await flushEditorContent();
    setExpanded((current) => !current);
  }, [flushEditorContent]);

  return {
    expanded,
    setExpandedWithFlush,
    toggleExpand,
  };
}
