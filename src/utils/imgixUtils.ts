
import ImgixClient from '@imgix/js-core';

// Initialize the imgix client
// Note: In a production environment, you would use your own imgix source
const client = new ImgixClient({
  domain: 'assets.imgix.net', // Replace with your imgix domain
  secureURLToken: '', // Add your token if using signed URLs
});

/**
 * Creates an imgix URL with masking parameters
 * @param imageUrl Base image URL
 * @param maskImageUrl URL of the mask image
 * @param params Additional imgix parameters
 * @returns Processed imgix URL
 */
export const createMaskedImageUrl = (
  imageUrl: string,
  maskImageUrl: string,
  params: Record<string, string | number> = {}
) => {
  // Convert File objects to URLs if needed
  return client.buildURL(imageUrl, {
    mask: maskImageUrl,
    ...params,
  });
};

/**
 * Converts a File object to a data URL
 * @param file File to convert
 * @returns Promise resolving to a data URL
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a canvas to a data URL
 * @param canvas HTML Canvas Element
 * @returns Data URL of the canvas content
 */
export const canvasToDataUrl = (canvas: HTMLCanvasElement): string => {
  return canvas.toDataURL('image/png');
};
