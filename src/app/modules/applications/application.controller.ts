import { Request, Response } from "express";
import { Application } from "./application.model";
import { Tenant } from "../tenants/tenant.model";
import { Apartment } from "../apartments/apartment.model";
import { Owner } from "../owners/owner.model";
import {
  ICreateApplication,
  IUpdateApplication,
  IReviewApplication,
} from "./application.type";
import sendResponse from "../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import NotFoundError from "../../errors/not-found";
import ForbiddenError from "../../errors/forbidden";
import BadRequestError from "../../errors/bad-request";

export class ApplicationController {
  // Create a new application
  static readonly createApplication = async (req: Request, res: Response) => {
    try {
      const applicationData: ICreateApplication = req.body;
      const userId = req.user?._id;

      // Find the tenant associated with the current user
      const tenant = await Tenant.findOne({ user: userId });
      if (!tenant) {
        throw new ForbiddenError("Only tenants can create applications");
      }

      // Check if apartment exists and is available
      const apartment = await Apartment.findById(applicationData.apartmentId);
      if (!apartment) {
        throw new NotFoundError("Apartment not found");
      }

      if (apartment.availability.status !== "available") {
        throw new BadRequestError(
          "Apartment is not available for applications"
        );
      }

      if (apartment.status !== "active") {
        throw new BadRequestError("Apartment is not active");
      }

      // Check if tenant can apply (no existing pending/approved applications)
      const canApply = await Application.canApply(
        tenant._id,
        applicationData.apartmentId
      );
      if (!canApply) {
        throw new BadRequestError(
          "You already have a pending or approved application for this apartment"
        );
      }

      // Handle uploaded documents
      const documents: any = {};
      if (req.files) {
        const files = req.files as any[];
        files.forEach((file) => {
          const fieldName = file.fieldname;
          if (fieldName === "idProof") {
            documents.idProof = file.filename;
          } else if (fieldName === "incomeProof") {
            documents.incomeProof = file.filename;
          } else if (fieldName === "bankStatement") {
            documents.bankStatement = file.filename;
          } else if (fieldName === "references") {
            if (!documents.references) documents.references = [];
            documents.references.push(file.filename);
          }
        });
      }

      // Create application
      const application = new Application({
        tenant: tenant._id,
        apartment: applicationData.apartmentId,
        applicationDetails: applicationData.applicationDetails,
        documents,
      });

      await application.save();

      // Populate related data in response
      await application.populate([
        { path: "tenant", select: "firstName lastName email phone" },
        { path: "apartment", select: "title address rent propertyDetails" },
      ]);

      sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "Application submitted successfully",
        data: application,
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

  // Get all applications (admin/staff only)
  static readonly getAllApplications = async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        apartmentId,
        tenantId,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Build query
      const query: any = {};
      if (status) {
        query.status = status;
      }
      if (apartmentId) {
        query.apartment = apartmentId;
      }
      if (tenantId) {
        query.tenant = tenantId;
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

      const applications = await Application.find(query)
        .populate("tenant", "firstName lastName email phone")
        .populate("apartment", "title address rent propertyDetails owner")
        .populate("reviewedBy", "email")
        .skip(skip)
        .limit(Number(limit))
        .sort(sort);

      const total = await Application.countDocuments(query);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Applications retrieved successfully",
        data: {
          applications,
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

  // Get single application by ID
  static readonly getApplicationById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const application = await Application.findById(id)
        .populate("tenant", "firstName lastName email phone address")
        .populate("apartment", "title address rent propertyDetails owner")
        .populate("reviewedBy", "email");

      if (!application) {
        throw new NotFoundError("Application not found");
      }

      // Check access permissions
      const isTenant = application.tenant.user.toString() === userId.toString();
      const isOwner =
        application.apartment.owner.user.toString() === userId.toString();
      const isAdmin =
        req.user?.roles?.includes("admin") ||
        req.user?.roles?.includes("staff");

      if (!isTenant && !isOwner && !isAdmin) {
        throw new ForbiddenError(
          "You don't have permission to view this application"
        );
      }

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Application retrieved successfully",
        data: application,
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

  // Update application (tenant can update their own pending applications)
  static readonly updateApplication = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData: IUpdateApplication = req.body;
      const userId = req.user?._id;

      const application = await Application.findById(id).populate("tenant");
      if (!application) {
        throw new NotFoundError("Application not found");
      }

      // Check if user is the tenant who created the application
      const isTenant = application.tenant.user.toString() === userId.toString();
      if (!isTenant) {
        throw new ForbiddenError("You can only update your own applications");
      }

      // Only allow updates to pending applications
      if (application.status !== "pending") {
        throw new BadRequestError("You can only update pending applications");
      }

      // Handle new uploaded documents
      if (req.files) {
        const files = req.files as any[];
        files.forEach((file) => {
          const fieldName = file.fieldname;
          if (fieldName === "idProof") {
            updateData.documents = {
              ...updateData.documents,
              idProof: file.filename,
            };
          } else if (fieldName === "incomeProof") {
            updateData.documents = {
              ...updateData.documents,
              incomeProof: file.filename,
            };
          } else if (fieldName === "bankStatement") {
            updateData.documents = {
              ...updateData.documents,
              bankStatement: file.filename,
            };
          } else if (fieldName === "references") {
            const currentRefs = application.documents.references || [];
            updateData.documents = {
              ...updateData.documents,
              references: [...currentRefs, file.filename],
            };
          }
        });
      }

      const updatedApplication = await Application.findByIdAndUpdate(
        id,
        { ...updateData },
        { new: true, runValidators: true }
      ).populate([
        { path: "tenant", select: "firstName lastName email phone" },
        { path: "apartment", select: "title address rent propertyDetails" },
      ]);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Application updated successfully",
        data: updatedApplication,
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

  // Review application (owner/admin only)
  static readonly reviewApplication = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const reviewData: IReviewApplication = req.body;
      const userId = req.user?._id;

      const application = await Application.findById(id)
        .populate("apartment")
        .populate("tenant");

      if (!application) {
        throw new NotFoundError("Application not found");
      }

      // Check permissions
      const isOwner =
        application.apartment.owner.user.toString() === userId.toString();
      const isAdmin =
        req.user?.roles?.includes("admin") ||
        req.user?.roles?.includes("staff");

      if (!isOwner && !isAdmin) {
        throw new ForbiddenError(
          "You don't have permission to review this application"
        );
      }

      // Update application with review
      const updatedApplication = await Application.findByIdAndUpdate(
        id,
        {
          status: reviewData.status,
          reviewNotes: reviewData.reviewNotes,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
        { new: true, runValidators: true }
      ).populate([
        { path: "tenant", select: "firstName lastName email phone" },
        { path: "apartment", select: "title address rent propertyDetails" },
        { path: "reviewedBy", select: "email" },
      ]);

      // If approved, update apartment availability
      if (reviewData.status === "approved") {
        await Apartment.findByIdAndUpdate(application.apartment._id, {
          "availability.status": "rented",
        });
      }

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Application reviewed successfully",
        data: updatedApplication,
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

  // Delete application (tenant can delete their own pending applications)
  static readonly deleteApplication = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const application = await Application.findById(id).populate("tenant");
      if (!application) {
        throw new NotFoundError("Application not found");
      }

      // Check permissions
      const isTenant = application.tenant.user.toString() === userId.toString();
      const isAdmin = req.user?.roles?.includes("admin");

      if (!isTenant && !isAdmin) {
        throw new ForbiddenError("You can only delete your own applications");
      }

      // Only allow deletion of pending applications
      if (application.status !== "pending" && !isAdmin) {
        throw new BadRequestError("You can only delete pending applications");
      }

      await Application.findByIdAndDelete(id);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Application deleted successfully",
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

  // Get applications by tenant (for tenant dashboard)
  static readonly getApplicationsByTenant = async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId = req.user?._id;
      const { page = 1, limit = 10, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Find the tenant associated with the current user
      const tenant = await Tenant.findOne({ user: userId });
      if (!tenant) {
        throw new ForbiddenError("Only tenants can access this endpoint");
      }

      // Build query
      const query: any = { tenant: tenant._id };
      if (status) {
        query.status = status;
      }

      const applications = await Application.find(query)
        .populate("apartment", "title address rent propertyDetails images")
        .populate("reviewedBy", "email")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await Application.countDocuments(query);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Tenant applications retrieved successfully",
        data: {
          applications,
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

  // Get applications by apartment owner
  static readonly getApplicationsByOwner = async (
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

      // Get applications for owner's apartments
      const applications = await Application.find()
        .populate({
          path: "apartment",
          match: { owner: owner._id },
        })
        .populate("tenant", "firstName lastName email phone")
        .populate("reviewedBy", "email")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      // Filter out applications where apartment doesn't match (due to populate match)
      const filteredApplications = applications.filter((app) => app.apartment);

      // Apply status filter if provided
      const finalApplications = status
        ? filteredApplications.filter((app) => app.status === status)
        : filteredApplications;

      const total = finalApplications.length;

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Owner applications retrieved successfully",
        data: {
          applications: finalApplications,
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

  // Get application statistics (admin only)
  static readonly getApplicationStats = async (req: Request, res: Response) => {
    try {
      const totalApplications = await Application.countDocuments();
      const pendingApplications = await Application.countDocuments({
        status: "pending",
      });
      const underReviewApplications = await Application.countDocuments({
        status: "under_review",
      });
      const approvedApplications = await Application.countDocuments({
        status: "approved",
      });
      const rejectedApplications = await Application.countDocuments({
        status: "rejected",
      });

      // Applications by month (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyStats = await Application.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
      ]);

      sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Application statistics retrieved successfully",
        data: {
          total: totalApplications,
          pending: pendingApplications,
          underReview: underReviewApplications,
          approved: approvedApplications,
          rejected: rejectedApplications,
          monthlyStats,
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
