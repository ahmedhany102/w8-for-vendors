import imageCompression from 'browser-image-compression';

/**
 * Compress an image file before upload
 * Reduces file size while maintaining acceptable quality for e-commerce
 * 
 * @param file - The original image file
 * @param options - Optional compression settings override
 * @returns Compressed image file
 */
export async function compressImage(
    file: File,
    options?: {
        maxSizeMB?: number;
        maxWidthOrHeight?: number;
        quality?: number;
    }
): Promise<File> {
    // Skip compression for non-image files
    if (!file.type.startsWith('image/')) {
        console.log('⚠️ Skipping compression - not an image file');
        return file;
    }

    // Skip compression for already small files (< 500KB)
    if (file.size < 500 * 1024) {
        console.log('✅ File already small, skipping compression:', (file.size / 1024).toFixed(1), 'KB');
        return file;
    }

    const compressionOptions = {
        maxSizeMB: options?.maxSizeMB ?? 1,
        maxWidthOrHeight: options?.maxWidthOrHeight ?? 1920,
        useWebWorker: true,
        initialQuality: options?.quality ?? 0.8,
        // Preserve filename
        fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
    };

    try {
        console.log('🔄 Compressing image:', file.name, '| Original:', (file.size / 1024 / 1024).toFixed(2), 'MB');

        const compressedBlob = await imageCompression(file, compressionOptions);

        // Convert blob back to File with original name
        const compressedFile = new File([compressedBlob], file.name, {
            type: compressedBlob.type,
            lastModified: Date.now(),
        });

        const savings = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
        console.log(
            '✅ Compression complete:',
            (compressedFile.size / 1024).toFixed(1), 'KB',
            `(${savings}% smaller)`
        );

        return compressedFile;
    } catch (error) {
        console.error('❌ Image compression failed, using original:', error);
        return file; // Fallback to original if compression fails
    }
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(files: File[]): Promise<File[]> {
    return Promise.all(files.map(file => compressImage(file)));
}

export default compressImage;
