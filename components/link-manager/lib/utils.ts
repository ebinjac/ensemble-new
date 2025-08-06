// app/utils/favicon.ts
import { parseFaviconFromWebsite, type FaviconInfo } from '@/app/actions/link-manager/favicon';

export async function getFaviconFromWebsite(websiteUrl: string): Promise<string | null> {
  try {
    const result = await parseFaviconFromWebsite(websiteUrl);
    
    if (!result.success || !result.favicons || result.favicons.length === 0) {
      return null;
    }
    
    // Return the first (highest priority) favicon
    return result.favicons[0].url;
    
  } catch (error) {
    console.error('Error getting favicon:', error);
    return null;
  }
}

export async function getAllFaviconsFromWebsite(websiteUrl: string): Promise<FaviconInfo[]> {
  try {
    const result = await parseFaviconFromWebsite(websiteUrl);
    
    if (!result.success || !result.favicons) {
      return [];
    }
    
    return result.favicons;
    
  } catch (error) {
    console.error('Error getting favicons:', error);
    return [];
  }
}

export async function testImageExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      resolve(false);
    }, 3000); // 3 second timeout
    
    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
    
    img.src = url;
  });
}
