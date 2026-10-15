import { useWindowDimensions } from 'react-native';

export const DESKTOP_BREAKPOINT = 900;
export const SIDEBAR_WIDTH = 240;
export const PLAYER_HEIGHT = 80;

export function useDesktop() {
  const { width } = useWindowDimensions();
  return width >= DESKTOP_BREAKPOINT;
}
