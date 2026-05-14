import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ secure: true });

export async function uploadImage(filePath: string): Promise<string> {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'momentum',
    resource_type: 'image',
  });
  return result.secure_url;
}
