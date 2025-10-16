import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";
import { Readable } from "stream";
import multer from "multer";
import type { Express } from "express";

// This helper is designed to be easily swappable with an S3 upload function in the future.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string = "general"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validate Cloudinary configuration
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      reject(
        new Error(
          "Cloudinary configuration is missing. Please check your environment variables."
        )
      );
      return;
    }

    // Determine file type and folder
    const fileType = file.mimetype.startsWith("image/")
      ? "images"
      : "documents";
    const uploadFolder = `${folder}/${fileType}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: uploadFolder,
        resource_type: fileType === "images" ? "image" : "raw",
        public_id: `${Date.now()}_${file.originalname.replace(
          /\.[^/.]+$/,
          ""
        )}`,
        overwrite: true,
        transformation:
          fileType === "images"
            ? [{ width: 800, height: 600, crop: "limit", quality: "auto" }]
            : undefined,
      },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined
      ) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(new Error(`File upload failed: ${error.message}`));
          return;
        }
        if (result && result.secure_url) {
          resolve(result.secure_url);
        } else {
          reject(
            new Error("Cloudinary upload failed - no secure URL returned")
          );
        }
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

const deleteFromCloudinary = async (
  secureUrl: string
): Promise<UploadApiResponse | undefined> => {
  return new Promise((resolve, reject) => {
    try {
      // Extract public_id from Cloudinary URL
      // Example URL: https://res.cloudinary.com/cloud/image/upload/v123456/folder/subfolder/filename.jpg
      // Public ID: folder/subfolder/filename

      const parts = secureUrl.split("/");
      const uploadIndex = parts.indexOf("upload");

      if (uploadIndex === -1 || uploadIndex >= parts.length - 1) {
        reject(new Error("Invalid Cloudinary URL format"));
        return;
      }

      // Get all parts after 'upload' (skip version if present)
      let pathParts = parts.slice(uploadIndex + 1);

      // Remove version identifier (e.g., v1234567)
      if (
        pathParts[0] &&
        pathParts[0].startsWith("v") &&
        /^v\d+$/.test(pathParts[0])
      ) {
        pathParts = pathParts.slice(1);
      }

      // Join the path and remove file extension
      const publicIdWithExtension = pathParts.join("/");
      const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, "");

      if (!publicId) {
        reject(new Error("Failed to extract publicId"));
        return;
      }

      cloudinary.uploader.destroy(
        publicId,
        (error: Error, result: UploadApiResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

// Multer instance for file upload middleware
const upload = multer();

export const FileUploadHelper = {
  uploadToCloudinary,
  deleteFromCloudinary,
  upload,
};
