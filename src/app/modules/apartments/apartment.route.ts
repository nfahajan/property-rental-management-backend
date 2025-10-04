import { ApartmentController } from "./apartment.controller";
import auth from "../../middlewares/authentication";
import hasRole from "../../middlewares/has-role";
import { handleFileData } from "../../shared/handleFileData";
import expressPromiseRouter from "express-promise-router";

const router = expressPromiseRouter();

// Public routes - anyone can view available apartments
router.get("/", ApartmentController.getAllApartments);
router.get("/:id", ApartmentController.getApartmentById);

// Protected routes - require authentication
router.get(
  "/owner/my-apartments",
  auth,
  hasRole("owner"),
  ApartmentController.getApartmentsByOwner
);

// Owner routes - only property owners can create/manage their apartments
router.post(
  "/",
  auth,
  hasRole("owner"),
  handleFileData.array("images", 20),
  ApartmentController.createApartment
);
router.put(
  "/:id",
  auth,
  hasRole("owner"),
  handleFileData.array("images", 20),
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

// Admin/Staff routes - can manage all apartments
router.put(
  "/admin/:id",
  auth,
  hasRole("admin", "staff"),
  handleFileData.array("images", 20),
  ApartmentController.updateApartment
);
router.delete(
  "/admin/:id",
  auth,
  hasRole("admin"),
  ApartmentController.deleteApartment
);
router.get(
  "/admin/stats",
  auth,
  hasRole("admin", "staff"),
  ApartmentController.getApartmentStats
);

export const ApartmentRoute = router;
