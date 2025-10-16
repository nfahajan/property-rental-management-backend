import { Schema, model } from "mongoose";
import { ITenant, TenantModel } from "./tenant.type";

// mongoose tenant schema
const tenantSchema = new Schema<ITenant, TenantModel>(
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
    profileImage:{
      type:String
    },
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      zipCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
        default: "USA",
      },
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
tenantSchema.index({ user: 1 });
tenantSchema.index({ status: 1 });

// Virtual for full name
tenantSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export const Tenant = model<ITenant, TenantModel>("Tenant", tenantSchema);
