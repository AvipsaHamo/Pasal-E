import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'imageProxy',
  standalone: true
})
export class ImageProxyPipe implements PipeTransform {
  transform(imageUrl: string | null | undefined): string {
    if (!imageUrl) return '';

    // If it's already a proxied URL, return as-is
    if (imageUrl.startsWith('/api/images/')) {
      return imageUrl;
    }

    // If it's an Azure blob URL, extract the blob name and convert to proxy URL
    if (imageUrl.includes('pasaleimages.blob.core.windows.net')) {
      // Extract blob name from URL
      // URL format: https://pasaleimages.blob.core.windows.net/pasal-e-images/[blobName]?[sas-token]
      const match = imageUrl.match(/pasal-e-images\/([^?]+)/);
      if (match && match[1]) {
        return `/api/images/${match[1]}`;
      }
    }

    // Return as-is if not recognized
    return imageUrl;
  }
}
