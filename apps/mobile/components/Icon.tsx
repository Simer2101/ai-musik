import Svg, { Path, Polygon, Rect } from 'react-native-svg';

export type IconName =
  | 'prev'
  | 'next'
  | 'play'
  | 'pause'
  | 'shuffle'
  | 'repeat'
  | 'heart'
  | 'heartFilled'
  | 'headphones'
  | 'radio'
  | 'plus'
  | 'library'
  | 'card'
  | 'person'
  | 'chevronLeft'
  | 'chevronRight'
  | 'eye'
  | 'eyeOff';

export function Icon({
  name,
  color,
  size = 22,
}: {
  name: IconName;
  color: string;
  size?: number;
}) {
  const stroke = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      {name === 'play' ? <Polygon points="8,5 20,12 8,19" fill={color} /> : null}

      {name === 'pause' ? (
        <>
          <Rect x="7" y="5" width="3.6" height="14" rx="1.6" fill={color} />
          <Rect x="13.4" y="5" width="3.6" height="14" rx="1.6" fill={color} />
        </>
      ) : null}

      {name === 'prev' ? (
        <>
          <Polygon points="19,5 19,19 8.5,12" fill={color} />
          <Rect x="4.5" y="5" width="2.8" height="14" rx="1.4" fill={color} />
        </>
      ) : null}

      {name === 'next' ? (
        <>
          <Polygon points="5,5 15.5,12 5,19" fill={color} />
          <Rect x="16.7" y="5" width="2.8" height="14" rx="1.4" fill={color} />
        </>
      ) : null}

      {name === 'shuffle' ? (
        <>
          <Path d="M16 4h4v4" {...stroke} />
          <Path d="M20 4 4 20" {...stroke} />
          <Path d="M16 20h4v-4" {...stroke} />
          <Path d="M4 4l5.5 5.5" {...stroke} />
          <Path d="M14.5 14.5 20 20" {...stroke} />
        </>
      ) : null}

      {name === 'repeat' ? (
        <>
          <Path d="M7 7h9a4 4 0 0 1 4 4v1" {...stroke} />
          <Path d="M17 17H8a4 4 0 0 1-4-4v-1" {...stroke} />
          <Path d="M9.5 4.5 7 7l2.5 2.5" {...stroke} />
          <Path d="M14.5 14.5 17 17l-2.5 2.5" {...stroke} />
        </>
      ) : null}

      {name === 'heart' || name === 'heartFilled' ? (
        <Path
          d="M12 20.3 4.6 13a4.8 4.8 0 0 1 0-6.8 4.8 4.8 0 0 1 6.8 0l.6.6.6-.6a4.8 4.8 0 0 1 6.8 0 4.8 4.8 0 0 1 0 6.8Z"
          stroke={color}
          strokeWidth={name === 'heartFilled' ? 0 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={name === 'heartFilled' ? color : 'none'}
        />
      ) : null}

      {name === 'headphones' ? (
        <>
          <Path d="M4 14v-2a8 8 0 0 1 16 0v2" {...stroke} />
          <Rect x="2.8" y="13.5" width="4.4" height="7" rx="2.2" fill={color} />
          <Rect x="16.8" y="13.5" width="4.4" height="7" rx="2.2" fill={color} />
        </>
      ) : null}

      {name === 'radio' ? (
        <>
          <Path d="M12 9.5v5" {...stroke} />
          <Path d="M8.5 7.5a5 5 0 0 0 0 9" {...stroke} />
          <Path d="M15.5 7.5a5 5 0 0 1 0 9" {...stroke} />
          <Path d="M5.5 4.5a9 9 0 0 0 0 15" {...stroke} />
          <Path d="M18.5 4.5a9 9 0 0 1 0 15" {...stroke} />
        </>
      ) : null}

      {name === 'plus' ? (
        <>
          <Path d="M12 6v12" {...stroke} />
          <Path d="M6 12h12" {...stroke} />
        </>
      ) : null}

      {name === 'library' ? (
        <>
          <Rect x="3.5" y="4.5" width="4" height="15" rx="1.6" {...stroke} />
          <Rect x="10" y="4.5" width="4" height="15" rx="1.6" {...stroke} />
          <Path d="M17.6 5.6l3 14.2" {...stroke} />
        </>
      ) : null}

      {name === 'card' ? (
        <>
          <Rect x="3" y="5.5" width="18" height="13" rx="3" {...stroke} />
          <Path d="M3 10h18" {...stroke} />
        </>
      ) : null}

      {name === 'chevronLeft' ? <Path d="M15 5 8 12l7 7" {...stroke} /> : null}
      {name === 'chevronRight' ? <Path d="M9 5l7 7-7 7" {...stroke} /> : null}

      {name === 'eye' ? (
        <>
          <Path d="M2.5 12s3.6-7 9.5-7 9.5 7 9.5 7-3.6 7-9.5 7-9.5-7-9.5-7Z" {...stroke} />
          <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" {...stroke} />
        </>
      ) : null}

      {name === 'eyeOff' ? (
        <>
          <Path d="M4 5.5 19.5 21" {...stroke} />
          <Path d="M9.1 8.7A7.4 7.4 0 0 1 12 8c5.9 0 9.5 7 9.5 7a15 15 0 0 1-3.4 3.8" {...stroke} />
          <Path d="M6.2 6.7A15 15 0 0 0 2.5 12s3.6 7 9.5 7c1.4 0 2.7-.3 3.8-.8" {...stroke} />
        </>
      ) : null}

      {name === 'person' ? (
        <>
          <Path d="M12 11.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" {...stroke} />
          <Path d="M4.5 20c0-3.6 3.4-5.5 7.5-5.5s7.5 1.9 7.5 5.5" {...stroke} />
        </>
      ) : null}
    </Svg>
  );
}
