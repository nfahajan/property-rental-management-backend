import { Schema, model } from "mongoose";
import { IOwner, OwnerModel } from "./owner.type";

// mongoose owner schema
const ownerSchema = new Schema<IOwner, OwnerModel>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    address: {
      street: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      zipCode: {
        type: String,
        required: [true, "Zip code is required"],
        trim: true,
      },
      country: {
        type: String,
        required: [true, "Country is required"],
        trim: true,
        default: "USA",
      },
    },
    businessInfo: {
      businessName: {
        type: String,
        trim: true,
      },
      businessType: {
        type: String,
        trim: true,
      },
      taxId: {
        type: String,
        trim: true,
      },
      licenseNumber: {
        type: String,
        trim: true,
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "active",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// Index for better query performance
ownerSchema.index({ user: 1 });
ownerSchema.index({ status: 1 });

// Virtual for full name
ownerSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for business name or full name
ownerSchema.virtual("displayName").get(function () {
  return (
    this.businessInfo?.businessName || `${this.firstName} ${this.lastName}`
  );
});

export const Owner = model<IOwner, OwnerModel>("Owner", ownerSchema);
