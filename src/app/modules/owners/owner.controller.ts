import { Request, Response } from "express";
import { Owner } from "./owner.model";
import { User } from "../user/user.model";
import { ICreateOwner, IUpdateOwner } from "./owner.type";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import NotFoundError from "../../errors/not-found";
import BadRequestError from "../../errors/bad-request";

export class OwnerController {
  // Create a new owner and associated user
  static readonly createOwner = async (req: Request, res: Response) => {
    try {
      const ownerData: ICreateOwner = req.body;

      // Check if user with email already exists
      const existingUser = await User.findOne({ email: ownerData.email });
      if (existingUser) {
        throw new BadRequestError("User with this email already exists");
      }

      // Create user account for the owner
      const user = new User({
        email: ownerData.email,
        password: ownerData.password,
        roles: ["owner"],
        status: "approved",
        auth_type: "standard",
      });

      await user.save();

      // Create owner profile
      const owner = new Owner({
        ...ownerData,
        user: user._id,
      });

      await owner.save();

      // Populate user data in response
      await owner.populate("user", "email roles status");

      sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Owner created successfully",
        data: owner,
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

  // Get all owners
  static readonly getAllOwners = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build query
      const query: any = {};
      if (status) {
        query.status = status;
      }
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { "businessInfo.businessName": { $regex: search, $options: "i" } },
        ];
      }

      const owners = await Owner.find(query)
        .populate("user", "email roles status")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await Owner.countDocuments(query);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Owners retrieved successfully",
        data: {
          owners,
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

  // Get single owner by ID
  static readonly getOwnerById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const owner = await Owner.findById(id).populate(
        "user",
        "email roles status"
      );

      if (!owner) {
        throw new NotFoundError("Owner not found");
      }

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Owner retrieved successfully",
        data: owner,
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

  // Update owner
  static readonly updateOwner = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData: IUpdateOwner = req.body;

      const owner = await Owner.findByIdAndUpdate(
        id,
        { ...updateData },
        { new: true, runValidators: true }
      ).populate("user", "email roles status");

      if (!owner) {
        throw new NotFoundError("Owner not found");
      }

      // If email is being updated, update the associated user as well
      if (updateData.email) {
        await User.findByIdAndUpdate(owner.user._id, {
          email: updateData.email,
        });
      }

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Owner updated successfully",
        data: owner,
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

  // Delete owner (admin only)
  static readonly deleteOwner = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const owner = await Owner.findById(id);
      if (!owner) {
        throw new NotFoundError("Owner not found");
      }

      // Delete the associated user account
      await User.findByIdAndDelete(owner.user);

      // Delete the owner
      await Owner.findByIdAndDelete(id);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Owner deleted successfully",
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

  // Get owner by user ID (for profile access)
  static readonly getOwnerByUserId = async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;

      const owner = await Owner.findOne({ user: userId }).populate(
        "user",
        "email roles status"
      );

      if (!owner) {
        throw new NotFoundError("Owner profile not found");
      }

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Owner profile retrieved successfully",
        data: owner,
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

  // Get owners statistics (admin only)
  static readonly getOwnerStats = async (req: Request, res: Response) => {
    try {
      const totalOwners = await Owner.countDocuments();
      const activeOwners = await Owner.countDocuments({ status: "active" });
      const pendingOwners = await Owner.countDocuments({ status: "pending" });
      const inactiveOwners = await Owner.countDocuments({ status: "inactive" });
      const suspendedOwners = await Owner.countDocuments({
        status: "suspended",
      });

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Owner statistics retrieved successfully",
        data: {
          total: totalOwners,
          active: activeOwners,
          pending: pendingOwners,
          inactive: inactiveOwners,
          suspended: suspendedOwners,
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
