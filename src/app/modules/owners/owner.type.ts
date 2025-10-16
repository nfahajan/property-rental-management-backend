/* eslint-disable no-unused-vars */
import { Document, Model } from "mongoose";

export interface IOwner extends Document {
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
  profileImage?:string;
  user: any; // Reference to User model
  createdAt: Date;
  updatedAt: Date;
}

export type OwnerModel = Model<IOwner>;

export interface ICreateOwner {
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
  profileImage?:string;
  password: string; // For creating user account
}

export interface IUpdateOwner {
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
  profileImage?:string;
}
