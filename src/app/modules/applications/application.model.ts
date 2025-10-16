import { Schema, model } from "mongoose";
import { IApplication, ApplicationModel } from "./application.type";

// mongoose application schema
const applicationSchema = new Schema<IApplication, ApplicationModel>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "Tenant is required"],
    },
    apartment: {
      type: Schema.Types.ObjectId,
      ref: "Apartment",
      required: [true, "Apartment is required"],
    },
    applicationDetails: {
      moveInDate: {
        type: Date,
        required: [true, "Move-in date is required"],
        validate: {
          validator: function (date: Date) {
            return date > new Date();
          },
          message: "Move-in date must be in the future",
        },
      },
      leaseTerm: {
        type: String,
        required: [true, "Lease term is required"],
        trim: true,
        enum: ["6 months", "1 year", "18 months", "2 years", "month-to-month"],
      },
      monthlyIncome: {
        type: Number,
        required: [true, "Monthly income is required"],
        min: [0, "Monthly income cannot be negative"],
      },
      employmentStatus: {
        type: String,
        required: [true, "Employment status is required"],
        enum: ["employed", "self-employed", "unemployed", "student", "retired"],
      },
      employerName: {
        type: String,
        trim: true,
      },
      employerPhone: {
        type: String,
        trim: true,
      },
      additionalInfo: {
        type: String,
        trim: true,
        maxlength: [1000, "Additional info cannot exceed 1000 characters"],
      },
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "withdrawn"],
      default: "pending",
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: [2000, "Review notes cannot exceed 2000 characters"],
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// Indexes for better query performance
applicationSchema.index({ tenant: 1 });
applicationSchema.index({ apartment: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ reviewedBy: 1 });

// Compound indexes
applicationSchema.index({ tenant: 1, apartment: 1 }, { unique: true }); // Prevent duplicate applications
applicationSchema.index({ apartment: 1, status: 1 });
applicationSchema.index({ tenant: 1, status: 1 });

// Virtual for application age in days
applicationSchema.virtual("ageInDays").get(function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for income to rent ratio
applicationSchema.virtual("incomeToRentRatio").get(function () {
  if (
    this.apartment &&
    this.apartment.rent &&
    this.applicationDetails.monthlyIncome
  ) {
    return this.applicationDetails.monthlyIncome / this.apartment.rent.amount;
  }
  return null;
});

// Pre-save middleware to set reviewedAt when status changes
applicationSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status !== "pending") {
    this.reviewedAt = new Date();
  }
  next();
});

// Static method to check if tenant can apply for apartment
applicationSchema.statics.canApply = async function (
  tenantId: string,
  apartmentId: string
): Promise<boolean> {
  // Check if tenant already has a pending or approved application for this apartment
  const existingApplication = await this.findOne({
    tenant: tenantId,
    apartment: apartmentId,
    status: { $in: ["pending", "under_review", "approved"] },
  });

  return !existingApplication;
};

// Static method to get applications by apartment owner
applicationSchema.statics.getApplicationsByOwner = async function (
  ownerId: string
) {
  return this.find()
    .populate({
      path: "apartment",
      match: { owner: ownerId },
    })
    .populate("tenant", "firstName lastName email phone")
    .populate("reviewedBy", "email")
    .sort({ createdAt: -1 });
};

export const Application = model<IApplication, ApplicationModel>(
  "Application",
  applicationSchema
);
