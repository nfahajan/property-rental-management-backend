import { Schema, model } from "mongoose";
import { IApartment, ApartmentModel } from "./apartment.type";

// mongoose apartment schema
const apartmentSchema = new Schema<IApartment, ApartmentModel>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
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
    propertyDetails: {
      bedrooms: {
        type: Number,
        required: [true, "Number of bedrooms is required"],
        min: [0, "Bedrooms cannot be negative"],
        max: [20, "Bedrooms cannot exceed 20"],
      },
      bathrooms: {
        type: Number,
        required: [true, "Number of bathrooms is required"],
        min: [0, "Bathrooms cannot be negative"],
        max: [20, "Bathrooms cannot exceed 20"],
      },
      squareFeet: {
        type: Number,
        required: [true, "Square feet is required"],
        min: [1, "Square feet must be at least 1"],
        max: [100000, "Square feet cannot exceed 100,000"],
      },
      floorNumber: {
        type: Number,
        min: [0, "Floor number cannot be negative"],
      },
      totalFloors: {
        type: Number,
        min: [1, "Total floors must be at least 1"],
      },
      yearBuilt: {
        type: Number,
        min: [1800, "Year built cannot be before 1800"],
        max: [
          new Date().getFullYear() + 5,
          "Year built cannot be in the future",
        ],
      },
    },
    amenities: {
      type: [String],
      default: [],
      validate: {
        validator: function (amenities: string[]) {
          return amenities.length <= 50; // Limit to 50 amenities
        },
        message: "Cannot have more than 50 amenities",
      },
    },
    rent: {
      amount: {
        type: Number,
        required: [true, "Rent amount is required"],
        min: [0, "Rent amount cannot be negative"],
        max: [1000000, "Rent amount cannot exceed 1,000,000"],
      },
      currency: {
        type: String,
        required: [true, "Currency is required"],
        default: "USD",
        enum: ["USD", "EUR", "GBP", "CAD", "AUD"],
      },
      period: {
        type: String,
        required: [true, "Rent period is required"],
        enum: ["monthly", "weekly", "daily"],
        default: "monthly",
      },
    },
    utilities: {
      included: {
        type: [String],
        default: [],
      },
      notIncluded: {
        type: [String],
        default: [],
      },
    },
    availability: {
      status: {
        type: String,
        required: [true, "Availability status is required"],
        enum: ["available", "rented", "maintenance", "unavailable"],
        default: "available",
      },
      availableFrom: {
        type: Date,
      },
      leaseTerm: {
        type: String,
        trim: true,
      },
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (images: string[]) {
          return images.length <= 20; // Limit to 20 images
        },
        message: "Cannot have more than 20 images",
      },
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "Owner",
      required: [true, "Owner is required"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "sold"],
      default: "active",
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
apartmentSchema.index({ owner: 1 });
apartmentSchema.index({ status: 1 });
apartmentSchema.index({ "availability.status": 1 });
apartmentSchema.index({ "rent.amount": 1 });
apartmentSchema.index({ "address.city": 1, "address.state": 1 });
apartmentSchema.index({ "propertyDetails.bedrooms": 1 });
apartmentSchema.index({ "propertyDetails.bathrooms": 1 });
apartmentSchema.index({ createdAt: -1 });

// Compound index for location-based searches
apartmentSchema.index({
  "address.city": 1,
  "address.state": 1,
  "address.zipCode": 1,
});

// Virtual for full address
apartmentSchema.virtual("fullAddress").get(function () {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}, ${this.address.country}`;
});

// Virtual for rent per month (normalize to monthly)
apartmentSchema.virtual("monthlyRent").get(function () {
  if (this.rent.period === "monthly") {
    return this.rent.amount;
  } else if (this.rent.period === "weekly") {
    return this.rent.amount * 4.33; // Average weeks per month
  } else if (this.rent.period === "daily") {
    return this.rent.amount * 30; // Average days per month
  }
  return this.rent.amount;
});

// Virtual for property type based on bedrooms
apartmentSchema.virtual("propertyType").get(function () {
  const bedrooms = this.propertyDetails.bedrooms;
  if (bedrooms === 0) return "Studio";
  if (bedrooms === 1) return "1 Bedroom";
  if (bedrooms === 2) return "2 Bedroom";
  if (bedrooms === 3) return "3 Bedroom";
  if (bedrooms === 4) return "4 Bedroom";
  return `${bedrooms} Bedroom`;
});

export const Apartment = model<IApartment, ApartmentModel>(
  "Apartment",
  apartmentSchema
);
