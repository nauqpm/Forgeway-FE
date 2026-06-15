const IMG_BB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || "";
const IMG_BB_UPLOAD_URL = "https://api.imgbb.com/1/upload";

/**
 * 🖼️ Upload one or more images to ImgBB
 * @param files Image list (FileList or File[])
 * @returns Image URLs after successful upload
 */
export const uploadImagesToImgBB = async (files: FileList | File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
        // ✅ Check file format
        if (!file.type.startsWith("image/")) {
            console.error(`❌ Invalid file: ${file.name}`);
            continue; // Skip non-image files
        }

        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch(`${IMG_BB_UPLOAD_URL}?key=${IMG_BB_API_KEY}`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                uploadedUrls.push(data.data.url); // ✅ Save successfully uploaded image URL
            } else {
                console.error(`❌ Image upload error ${file.name}:`, data.error.message);
            }
        } catch (error) {
            console.error(`❌ Connection error while uploading image ${file.name}:`, error);
        }
    }

    return uploadedUrls; // ✅ Return image URL list
};
