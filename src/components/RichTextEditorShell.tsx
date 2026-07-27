import { ReactNode } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '@/src/constants/theme';

export type RichTextEditorLayout = 'inline' | 'expanded';

type RichTextEditorShellProps = {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  footer?: ReactNode;
  showFooterInline?: boolean;
  children: (layout: RichTextEditorLayout) => ReactNode;
};

export function RichTextEditorShell({
  expanded,
  onExpandedChange,
  footer,
  showFooterInline = true,
  children,
}: RichTextEditorShellProps) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const inlineFooter =
    footer && showFooterInline && !expanded ? (
      <View
        style={styles.inlineFooter}
        {...(isWeb ? { onMouseDown: (event) => event.preventDefault() } : undefined)}>
        {footer}
      </View>
    ) : null;

  return (
    <>
      {!expanded ? (
        <>
          <View style={styles.container}>{children('inline')}</View>
          {inlineFooter}
        </>
      ) : null}

      <Modal
        visible={expanded}
        transparent={isWeb}
        animationType={isWeb ? 'fade' : 'slide'}
        presentationStyle="fullScreen"
        onRequestClose={() => onExpandedChange(false)}>
        <View
          style={[
            styles.expandedRoot,
            isWeb ? styles.expandedRootWeb : styles.expandedRootNative,
            !isWeb && {
              paddingTop: insets.top + spacing.sm,
              paddingBottom: insets.bottom + spacing.sm,
              paddingHorizontal: spacing.sm,
            },
          ]}>
          {isWeb ? (
            <Pressable
              style={styles.webBackdrop}
              onPress={() => onExpandedChange(false)}
              accessibilityLabel="Close expanded editor"
            />
          ) : null}

          <View
            style={[
              styles.expandedPanel,
              isWeb && {
                marginTop: insets.top + spacing.sm,
                marginBottom: insets.bottom + spacing.sm,
                marginHorizontal: spacing.sm,
              },
            ]}>
            <View style={[styles.container, styles.containerExpanded]}>
              {children('expanded')}
            </View>
            {footer ? (
              <View
                style={styles.expandedFooter}
                {...(isWeb ? { onMouseDown: (event) => event.preventDefault() } : undefined)}>
                {footer}
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    minHeight: 200,
    flexDirection: 'column',
  },
  containerExpanded: {
    flex: 1,
    minHeight: undefined,
  },
  expandedRoot: {
    flex: 1,
  },
  expandedRootWeb: {
    backgroundColor: 'transparent',
  },
  expandedRootNative: {
    backgroundColor: colors.background,
  },
  webBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  expandedPanel: {
    flex: 1,
    zIndex: 1,
  },
  expandedFooter: {
    paddingTop: spacing.sm,
  },
  inlineFooter: {},
});
