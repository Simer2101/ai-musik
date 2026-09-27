import { useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';

import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { SectionTitle } from '@/components/ui';
import { useDesktop } from '@/lib/layout';
import { useSettings } from '@/providers/SettingsProvider';

export function HorizontalCarousel({
  title,
  extra,
  children,
}: {
  title?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
}) {
  const { colors } = useSettings();
  const desktop = useDesktop();
  const scroller = useRef<ScrollView>(null);
  const offset = useRef(0);
  const [x, setX] = useState(0);
  const [viewW, setViewW] = useState(0);
  const [contentW, setContentW] = useState(0);

  const maxX = Math.max(0, contentW - viewW);
  const canLeft = x > 12;
  const canRight = contentW > viewW + 12 && x < maxX - 12;

  const jump = (direction: number) => {
    const step = Math.max(240, viewW * 0.72);
    const next = Math.max(0, Math.min(maxX, offset.current + direction * step));
    scroller.current?.scrollTo({ x: next, animated: true });
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.x;
    setX(offset.current);
  };

  const showArrows = desktop && (canLeft || canRight);
  const showHeader = Boolean(title || extra || showArrows);

  return (
    <View style={styles.wrap}>
      {showHeader ? (
        <View style={styles.header}>
          {title ? (
            <View style={styles.headerTitle}>
              {typeof title === 'string' ? <SectionTitle>{title}</SectionTitle> : title}
            </View>
          ) : (
            <View />
          )}
          <View style={styles.headerRight}>
            {extra}
            {showArrows ? (
              <View style={styles.arrows}>
                <PressableScale
                  onPress={() => jump(-1)}
                  disabled={!canLeft}
                  style={[
                    styles.arrow,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    !canLeft && styles.arrowOff,
                  ]}
                  scaleTo={0.92}>
                  <Icon name="chevronLeft" color={canLeft ? colors.text : colors.muted} size={20} />
                </PressableScale>
                <PressableScale
                  onPress={() => jump(1)}
                  disabled={!canRight}
                  style={[
                    styles.arrow,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    !canRight && styles.arrowOff,
                  ]}
                  scaleTo={0.92}>
                  <Icon name="chevronRight" color={canRight ? colors.text : colors.muted} size={20} />
                </PressableScale>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={(event) => setViewW(event.nativeEvent.layout.width)}
        onContentSizeChange={(width) => setContentW(width)}
        onMomentumScrollEnd={onScroll}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerTitle: { flex: 1, minWidth: 0 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  arrows: { flexDirection: 'row', gap: 8 },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowOff: { opacity: 0.4 },
  row: { gap: 12, paddingRight: 36 },
});
