/**
 * Processes an image file for use as an avatar.
 * Resizes the image to max 150x150 pixels and converts to Base64/JPEG (0.7 quality).
 * carefully handling the aspect ratio to crop or fit.
 * For simplicity in this v1, we will fit within 150x150 (contain).
 */
export const processAvatar = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject('El archivo debe ser una imagen.');
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 150;
                const MAX_HEIGHT = 150;
                let width = img.width;
                let height = img.height;

                // Calendar aspect ratio logic
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject('Error procesando imagen');
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                // Compress
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = () => reject('Error cargando la imagen');
        };
        reader.onerror = () => reject('Error leyendo el archivo');
    });
};
