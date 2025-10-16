/* eslint-disable no-unused-vars */
import { Document, Model } from "mongoose";

export interface ITenant extends Document {
  _id: any;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  dateOfBirth: Date;
  profileImage?:string;
  user: any; // Reference to User model
  createdAt: Date;
  updatedAt: Date;
}

export type TenantModel = Model<ITenant>;

export interface ICreateTenant {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  dateOfBirth: Date;
  profileImage?:string;
  password: string; // For creating user account
}

export interface IUpdateTenant {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  dateOfBirth?: Date;
  profileImage?:string;
}
