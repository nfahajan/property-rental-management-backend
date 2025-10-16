import { ApartmentController } from "./apartment.controller";
import auth from "../../middlewares/authentication";
import hasRole from "../../middlewares/has-role";
import { FileUploadHelper } from "../../shared/cloudinaryHelper";
import expressPromiseRouter from "express-promise-router";

const router = expressPromiseRouter();

// Admin/Staff routes - must come first before /:id routes
router.get(
  "/admin/stats",
  auth,
  hasRole("admin", "staff"),
  ApartmentController.getApartmentStats
);
router.patch(
  "/admin/:id",
  auth,
  hasRole("admin", "staff"),
  FileUploadHelper.upload.array("images", 20),
  ApartmentController.updateApartment
);
router.delete(
  "/admin/:id",
  auth,
  hasRole("admin"),
  ApartmentController.deleteApartment
);

// Owner specific routes - must come before /:id routes
router.get(
  "/owner/my-apartments",
  auth,
  hasRole("owner"),
  ApartmentController.getApartmentsByOwner
);

// Public routes - anyone can view available apartments
router.get("/", ApartmentController.getAllApartments);
router.get("/:id", ApartmentController.getApartmentById);

// Owner routes - only property owners can create/manage their apartments
router.post(
  "/",
  auth,
  hasRole("owner"),
  FileUploadHelper.upload.array("images", 20),
  ApartmentController.createApartment
);
router.patch(
  "/:id",
  auth,
  hasRole("owner", "admin"),
  FileUploadHelper.upload.array("images", 20),
  ApartmentController.updateApartment
);
router.delete(
  "/:id",
  auth,
  hasRole("owner"),
  ApartmentController.deleteApartment
);
router.patch(
  "/:id/remove-image",
  auth,
  hasRole("owner"),
  ApartmentController.removeApartmentImage
);

export const ApartmentRoute = router;
