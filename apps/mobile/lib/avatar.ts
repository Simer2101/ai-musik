import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

const AVATAR_SIZE = 256;

// Browsers keep the avatar in localStorage, so shrink it to a small square JPEG first.
function shrinkOnWeb(uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const side = Math.min(image.width, image.height);
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas unavailable'));
      ctx.drawImage(
        image,
        (image.width - side) / 2,
        (image.height - side) / 2,
        side,
        side,
        0,
        0,
        AVATAR_SIZE,
        AVATAR_SIZE
      );
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    image.onerror = () => reject(new Error('Image failed to load'));
    image.src = uri;
  });
}

/** Opens the photo library; returns the new avatar URI, or null if the listener cancelled. */
export async function pickAvatar(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets[0]) return null;
  const { uri } = result.assets[0];
  return Platform.OS === 'web' ? shrinkOnWeb(uri) : uri;
}
