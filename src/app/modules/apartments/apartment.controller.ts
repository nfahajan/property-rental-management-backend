import { Request, Response } from "express";
import { Apartment } from "./apartment.model";
import { Owner } from "../owners/owner.model";
import { ICreateApartment, IUpdateApartment } from "./apartment.type";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import NotFoundError from "../../errors/not-found";
import ForbiddenError from "../../errors/forbidden";
import { FileUploadHelper } from "../../shared/cloudinaryHelper";

export class ApartmentController {
  // Create a new apartment
  static readonly createApartment = async (req: Request, res: Response) => {
    try {
      const apartmentData: ICreateApartment = req.body;
      const userId = req.user?._id;

      // Find the owner associated with the current user
      const owner = await Owner.findOne({ user: userId });
      if (!owner) {
        throw new ForbiddenError("Only property owners can create apartments");
      }

      // Handle uploaded images - Upload to Cloudinary
      const images: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        try {
          // Upload all images to Cloudinary
          const uploadPromises = req.files.map((file: Express.Multer.File) =>
            FileUploadHelper.uploadToCloudinary(file, "apartments")
          );
          const uploadedUrls = await Promise.all(uploadPromises);
          images.push(...uploadedUrls);
        } catch (uploadError) {
          console.error("Failed to upload images to Cloudinary:", uploadError);
          throw new Error("Failed to upload apartment images");
        }
      }

      // Create apartment
      const apartment = new Apartment({
        ...apartmentData,
        owner: owner._id,
        images,
      });

      await apartment.save();

      // Populate owner data in response
      await apartment.populate(
        "owner",
        "firstName lastName email businessInfo"
      );

      sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Apartment created successfully",
        data: apartment,
      });
    } catch (error: any) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: error.message,
        data: {},
      });
    }
  };

  // Get all apartments with filtering and search
  static readonly getAllApartments = async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        availability,
        city,
        state,
        minRent,
        maxRent,
        bedrooms,
        bathrooms,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Build query
      const query: any = {};

      if (status) {
        query.status = status;
      }

      if (availability) {
        query["availability.status"] = availability;
      }

      if (city) {
        query["address.city"] = { $regex: city, $options: "i" };
      }

      if (state) {
        query["address.state"] = { $regex: state, $options: "i" };
      }

      if (minRent || maxRent) {
        query["rent.amount"] = {};
        if (minRent) query["rent.amount"].$gte = Number(minRent);
        if (maxRent) query["rent.amount"].$lte = Number(maxRent);
      }

      if (bedrooms) {
        query["propertyDetails.bedrooms"] = Number(bedrooms);
      }

      if (bathrooms) {
        query["propertyDetails.bathrooms"] = Number(bathrooms);
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { "address.street": { $regex: search, $options: "i" } },
          { "address.city": { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

      const apartments = await Apartment.find(query)
        .populate("owner", "firstName lastName email businessInfo")
        .skip(skip)
        .limit(Number(limit))
        .sort(sort);

      const total = await Apartment.countDocuments(query);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Apartments retrieved successfully",
        data: {
          apartments,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      sendResponse(res, {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
        data: {},
      });
    }
  };

  // Get single apartment by ID
  static readonly getApartmentById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const apartment = await Apartment.findById(id).populate(
        "owner",
        "firstName lastName email phone businessInfo"
      );

      if (!apartment) {
        throw new NotFoundError("Apartment not found");
      }

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Apartment retrieved successfully",
        data: apartment,
      });
    } catch (error: any) {
      sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: error.message,
        data: {},
      });
    }
  };

  // Update apartment
  static readonly updateApartment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData: IUpdateApartment = req.body;
      const userId = req.user?._id;

      const apartment = await Apartment.findById(id).populate("owner");
      if (!apartment) {
        throw new NotFoundError("Apartment not found");
      }

      // Check if user is the owner or admin
      const isOwner = apartment.owner.user.toString() === userId.toString();
      const isAdmin =
        req.user?.roles?.includes("admin") ||
        req.user?.roles?.includes("staff");

      if (!isOwner && !isAdmin) {
        throw new ForbiddenError("You can only update your own apartments");
      }

      // Handle new uploaded images - Upload to Cloudinary
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        try {
          // Upload all new images to Cloudinary
          const uploadPromises = req.files.map((file: Express.Multer.File) =>
            FileUploadHelper.uploadToCloudinary(file, "apartments")
          );
          const uploadedUrls = await Promise.all(uploadPromises);

          // Append new images to existing ones
          updateData.images = [...(apartment.images || []), ...uploadedUrls];
        } catch (uploadError) {
          console.error("Failed to upload images to Cloudinary:", uploadError);
          throw new Error("Failed to upload apartment images");
        }
      }

      const updatedApartment = await Apartment.findByIdAndUpdate(
        id,
        { ...updateData },
        { new: true, runValidators: true }
      ).populate("owner", "firstName lastName email businessInfo");

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Apartment updated successfully",
        data: updatedApartment,
      });
    } catch (error: any) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: error.message,
        data: {},
      });
    }
  };

  // Delete apartment
  static readonly deleteApartment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const apartment = await Apartment.findById(id).populate("owner");
      if (!apartment) {
        throw new NotFoundError("Apartment not found");
      }

      // Check if user is the owner or admin
      const isOwner = apartment.owner.user.toString() === userId.toString();
      const isAdmin = req.user?.roles?.includes("admin");

      if (!isOwner && !isAdmin) {
        throw new ForbiddenError("You can only delete your own apartments");
      }

      await Apartment.findByIdAndDelete(id);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Apartment deleted successfully",
        data: {},
      });
    } catch (error: any) {
      sendResponse(res, {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
        data: {},
      });
    }
  };

  // Get apartments by owner (for owner's dashboard)
  static readonly getApartmentsByOwner = async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId = req.user?._id;
      const { page = 1, limit = 10, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Find the owner associated with the current user
      const owner = await Owner.findOne({ user: userId });
      if (!owner) {
        throw new ForbiddenError(
          "Only property owners can access this endpoint"
        );
      }

      // Build query
      const query: any = { owner: owner._id };
      if (status) {
        query.status = status;
      }

      const apartments = await Apartment.find(query)
        .populate("owner", "firstName lastName email businessInfo")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await Apartment.countDocuments(query);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Owner apartments retrieved successfully",
        data: {
          apartments,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      sendResponse(res, {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
        data: {},
      });
    }
  };

  // Remove image from apartment
  static readonly removeApartmentImage = async (
    req: Request,
    res: Response
  ) => {
    try {
      const { id } = req.params;
      const { imageUrl } = req.body; // Changed from imageName to imageUrl
      const userId = req.user?._id;

      const apartment = await Apartment.findById(id).populate("owner");
      if (!apartment) {
        throw new NotFoundError("Apartment not found");
      }

      // Check if user is the owner or admin
      const isOwner = apartment.owner.user.toString() === userId.toString();
      const isAdmin =
        req.user?.roles?.includes("admin") ||
        req.user?.roles?.includes("staff");

      if (!isOwner && !isAdmin) {
        throw new ForbiddenError("You can only modify your own apartments");
      }

      // Delete image from Cloudinary
      try {
        await FileUploadHelper.deleteFromCloudinary(imageUrl);
      } catch (deleteError) {
        console.error("Failed to delete image from Cloudinary:", deleteError);
        // Continue even if deletion fails
      }

      // Remove image from array
      apartment.images = apartment.images.filter(
        (img: string) => img !== imageUrl
      );
      await apartment.save();

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Image removed successfully",
        data: apartment,
      });
    } catch (error: any) {
      sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: error.message,
        data: {},
      });
    }
  };

  // Get apartment statistics (admin only)
  static readonly getApartmentStats = async (req: Request, res: Response) => {
    try {
      const totalApartments = await Apartment.countDocuments();
      const availableApartments = await Apartment.countDocuments({
        "availability.status": "available",
      });
      const rentedApartments = await Apartment.countDocuments({
        "availability.status": "rented",
      });
      const activeApartments = await Apartment.countDocuments({
        status: "active",
      });

      // Average rent calculation
      const avgRentResult = await Apartment.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: null, avgRent: { $avg: "$rent.amount" } } },
      ]);
      const averageRent =
        avgRentResult.length > 0 ? avgRentResult[0].avgRent : 0;

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Apartment statistics retrieved successfully",
        data: {
          total: totalApartments,
          available: availableApartments,
          rented: rentedApartments,
          active: activeApartments,
          averageRent: Math.round(averageRent * 100) / 100,
        },
      });
    } catch (error: any) {
      sendResponse(res, {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        success: false,
        message: error.message,
        data: {},
      });
    }
  };
}
