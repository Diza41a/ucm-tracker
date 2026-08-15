import { type CustomMixedRenderer } from 'react-native-render-html';

import { openExternalLink, sanitizeLinkHref } from '@/src/utils/openExternalLink';

export const AnchorRenderer: CustomMixedRenderer = (props) => {
  const rawHref =
    typeof props.tnode.attributes.href === 'string' ? props.tnode.attributes.href : '';
  const href = sanitizeLinkHref(rawHref);

  if (!href) {
    return <props.TDefaultRenderer {...props} />;
  }

  return (
    <props.TDefaultRenderer
      {...props}
      onPress={() => {
        void openExternalLink(href);
      }}
      textProps={{
        ...props.textProps,
        selectable: false,
      }}
    />
  );
};
