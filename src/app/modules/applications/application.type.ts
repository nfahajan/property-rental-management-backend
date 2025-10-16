/* eslint-disable no-unused-vars */
import { Document, Model } from "mongoose";

export interface IApplication extends Document {
  _id: any;
  tenant: any; // Reference to Tenant model
  apartment: any; // Reference to Apartment model
  applicationDetails: {
    moveInDate: Date;
    leaseTerm: string;
    monthlyIncome: number;
    employmentStatus:
      | "employed"
      | "self-employed"
      | "unemployed"
      | "student"
      | "retired";
    employerName?: string;
    employerPhone?: string;
    additionalInfo?: string;
  };
  status: "pending" | "under_review" | "approved" | "rejected" | "withdrawn";
  reviewNotes?: string;
  reviewedBy?: any; // Reference to User model (admin/staff)
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationModel = {
  canApply(tenantId: string, apartmentId: string): Promise<boolean>;
  getApplicationsByOwner(ownerId: string): Promise<IApplication[]>;
} & Model<IApplication>;

export interface ICreateApplication {
  apartmentId: string;
  applicationDetails: {
    moveInDate: Date;
    leaseTerm: string;
    monthlyIncome: number;
    employmentStatus:
      | "employed"
      | "self-employed"
      | "unemployed"
      | "student"
      | "retired";
    employerName?: string;
    employerPhone?: string;
    additionalInfo?: string;
  };
}

export interface IUpdateApplication {
  applicationDetails?: {
    moveInDate?: Date;
    leaseTerm?: string;
    monthlyIncome?: number;
    employmentStatus?:
      | "employed"
      | "self-employed"
      | "unemployed"
      | "student"
      | "retired";
    employerName?: string;
    employerPhone?: string;
    additionalInfo?: string;
  };
  status?: "pending" | "under_review" | "approved" | "rejected" | "withdrawn";
  reviewNotes?: string;
}

export interface IReviewApplication {
  status: "under_review" | "approved" | "rejected";
  reviewNotes?: string;
}
