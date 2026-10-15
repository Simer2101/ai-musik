import { forwardRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';

import { bodyFamily } from '@/constants/Fonts';
import { useSettings } from '@/providers/SettingsProvider';

// Drop-in Text that renders Onest at the requested weight unless a fontFamily is already set.
function withBodyFont(style: TextProps['style']) {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return style;
  return [style, { fontFamily: bodyFamily(flat.fontWeight), fontWeight: 'normal' as const }];
}

export const Text = forwardRef<RNText, TextProps>(function Text({ style, ...props }, ref) {
  return <RNText ref={ref} {...props} style={withBodyFont(style)} />;
});

/**
 * Focus state for a field. Spread `onFocus`/`onBlur` onto the input and put `ring` on whatever
 * box should light up: the input itself, or the rounded row that wraps it with an icon.
 */
export function useFocusRing() {
  const { colors } = useSettings();
  const [focused, setFocused] = useState(false);
  const ring: ViewStyle | null = focused ? { boxShadow: `0 0 0 2px ${colors.accent}` } : null;
  return { ring, onFocus: () => setFocused(true), onBlur: () => setFocused(false) };
}

// The browser's square focus outline ignores rounded corners, so fields draw their own ring.
const noOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextInputProps['style']) : null;

type AppTextInputProps = TextInputProps & {
  /** Set false when a wrapping row shows the ring via `useFocusRing` instead. */
  ring?: boolean;
};

export const TextInput = forwardRef<RNTextInput, AppTextInputProps>(function TextInput(
  { style, ring = true, onFocus, onBlur, ...props },
  ref
) {
  const focus = useFocusRing();
  return (
    <RNTextInput
      ref={ref}
      {...props}
      onFocus={(event) => {
        focus.onFocus();
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focus.onBlur();
        onBlur?.(event);
      }}
      style={[withBodyFont(style), noOutline, ring ? (focus.ring as TextInputProps['style']) : null]}
    />
  );
});
