/* eslint-disable no-unused-vars */
import { Document, Model } from "mongoose";

export interface IApartment extends Document {
  _id: any;
  title: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  propertyDetails: {
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    floorNumber?: number;
    totalFloors?: number;
    yearBuilt?: number;
  };
  amenities: string[];
  rent: {
    amount: number;
    currency: string;
    period: "monthly" | "weekly" | "daily";
  };
  utilities: {
    included: string[];
  };
  availability: {
    status: "available" | "rented" | "maintenance" | "unavailable";
    availableFrom?: Date;
    leaseTerm?: string;
  };
  images: string[]; // Array of image file paths
  owner: any; // Reference to Owner model
  status: "active" | "inactive" | "pending" | "sold";
  createdAt: Date;
  updatedAt: Date;
}

export type ApartmentModel = Model<IApartment>;

export interface ICreateApartment {
  title: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  propertyDetails: {
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    floorNumber?: number;
    totalFloors?: number;
    yearBuilt?: number;
  };
  amenities: string[];
  rent: {
    amount: number;
    currency: string;
    period: "monthly" | "weekly" | "daily";
  };
  utilities: {
    included: string[];
  };
  availability: {
    status: "available" | "rented" | "maintenance" | "unavailable";
    availableFrom?: Date;
    leaseTerm?: string;
  };
}

export interface IUpdateApartment {
  title?: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  propertyDetails?: {
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    floorNumber?: number;
    totalFloors?: number;
    yearBuilt?: number;
  };
  amenities?: string[];
  rent?: {
    amount?: number;
    currency?: string;
    period?: "monthly" | "weekly" | "daily";
  };
  utilities?: {
    included?: string[];
  };
  availability?: {
    status?: "available" | "rented" | "maintenance" | "unavailable";
    availableFrom?: Date;
    leaseTerm?: string;
  };
  images?: string[];
  status?: "active" | "inactive" | "pending" | "sold";
}
