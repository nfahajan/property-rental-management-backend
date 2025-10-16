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
ownerSchema.index({ user: 1 });
ownerSchema.index({ status: 1 });

// Virtual for full name
ownerSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});


export const Owner = model<IOwner, OwnerModel>("Owner", ownerSchema);
