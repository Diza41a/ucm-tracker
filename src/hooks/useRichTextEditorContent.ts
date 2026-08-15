import { useCallback, useEffect, useRef, useState } from 'react';

export function useRichTextEditorContent(value: string, onChange: (html: string) => void) {
  const contentRef = useRef(value);
  const [editorHtml, setEditorHtml] = useState(value);
  const [externalSyncGeneration, setExternalSyncGeneration] = useState(0);
  const skipExternalValueSync = useRef(false);

  useEffect(() => {
    if (skipExternalValueSync.current) {
      skipExternalValueSync.current = false;
      if (value === contentRef.current) {
        return;
      }
    }

    if (value === contentRef.current) {
      return;
    }

    contentRef.current = value;
    setEditorHtml(value);
    setExternalSyncGeneration((generation) => generation + 1);
  }, [value]);

  const commitHtml = useCallback(
    (html: string) => {
      skipExternalValueSync.current = true;
      contentRef.current = html;
      onChange(html);
    },
    [onChange]
  );

  return {
    contentRef,
    editorHtml,
    commitHtml,
    externalSyncGeneration,
  };
}
