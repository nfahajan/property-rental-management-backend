import { Request, Response } from "express";
import { Tenant } from "./tenant.model";
import { User } from "../user/user.model";
import { ICreateTenant, IUpdateTenant } from "./tenant.type";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import NotFoundError from "../../errors/not-found";
import BadRequestError from "../../errors/bad-request";

export class TenantController {
  // Create a new tenant and associated user
  static readonly createTenant = async (req: Request, res: Response) => {
    try {
      const tenantData: ICreateTenant = req.body;

      // Check if user with email already exists
      const existingUser = await User.findOne({ email: tenantData.email });
      if (existingUser) {
        throw new BadRequestError("User with this email already exists");
      }

      // Create user account for the tenant
      const user = new User({
        email: tenantData.email,
        password: tenantData.password,
        roles: ["tenant"],
        status: "approved",
        auth_type: "standard",
      });

      await user.save();

      // Create tenant profile
      const tenant = new Tenant({
        ...tenantData,
        user: user._id,
      });

      await tenant.save();

      // Populate user data in response
      await tenant.populate("user", "email roles status");

      sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Tenant created successfully",
        data: tenant,
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

  // Get all tenants
  static readonly getAllTenants = async (req: Request, res: Response) => {
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
        ];
      }

      const tenants = await Tenant.find(query)
        .populate("user", "email roles status")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await Tenant.countDocuments(query);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Tenants retrieved successfully",
        data: {
          tenants,
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

  // Get single tenant by ID
  static readonly getTenantById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findById(id).populate(
        "user",
        "email roles status"
      );

      if (!tenant) {
        throw new NotFoundError("Tenant not found");
      }

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Tenant retrieved successfully",
        data: tenant,
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

  // Update tenant
  static readonly updateTenant = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData: IUpdateTenant = req.body;

      const tenant = await Tenant.findByIdAndUpdate(
        id,
        { ...updateData },
        { new: true, runValidators: true }
      ).populate("user", "email roles status");

      if (!tenant) {
        throw new NotFoundError("Tenant not found");
      }

      // If email is being updated, update the associated user as well
      if (updateData.email) {
        await User.findByIdAndUpdate(tenant.user._id, {
          email: updateData.email,
        });
      }

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Tenant updated successfully",
        data: tenant,
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

  // Delete tenant (admin only)
  static readonly deleteTenant = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findById(id);
      if (!tenant) {
        throw new NotFoundError("Tenant not found");
      }

      // Delete the associated user account
      await User.findByIdAndDelete(tenant.user);

      // Delete the tenant
      await Tenant.findByIdAndDelete(id);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Tenant deleted successfully",
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

  // Get tenant by user ID (for profile access)
  static readonly getTenantByUserId = async (req: Request, res: Response) => {
    try {
      const userId = req.user?._id;

      const tenant = await Tenant.findOne({ user: userId }).populate(
        "user",
        "email roles status"
      );

      if (!tenant) {
        throw new NotFoundError("Tenant profile not found");
      }

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Tenant profile retrieved successfully",
        data: tenant,
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
}
