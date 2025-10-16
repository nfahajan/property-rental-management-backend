import { OwnerController } from "./owner.controller";
import auth from "../../middlewares/authentication";
import hasRole from "../../middlewares/has-role";
import expressPromiseRouter from "express-promise-router";
import { FileUploadHelper } from "../../shared/cloudinaryHelper";

const router = expressPromiseRouter();

// Public routes - self-registration
router.post("/register", OwnerController.createOwner);

// Protected routes - require authentication
router.get("/profile", auth, OwnerController.getOwnerByUserId);

// Support both PUT and PATCH for profile updates (backward compatibility)
router.put(
  "/profile",
  auth,
  FileUploadHelper.upload.single("profileImage"),
  OwnerController.updateOwner
);
router.patch(
  "/profile",
  auth,
  FileUploadHelper.upload.single("profileImage"),
  OwnerController.updateOwner
);

// Admin routes - require authentication and appropriate roles
router.post("/", auth, hasRole("admin"), OwnerController.createOwner);
router.get("/", auth, hasRole("admin"), OwnerController.getAllOwners);
router.get("/stats", auth, hasRole("admin"), OwnerController.getOwnerStats);
router.get("/:id", auth, hasRole("admin"), OwnerController.getOwnerById);
router.put(
  "/:id",
  auth,
  hasRole("admin", "owner"),
  OwnerController.updateOwner
);

// Admin-only routes - only admin can delete owners
router.delete("/:id", auth, hasRole("admin"), OwnerController.deleteOwner);

export const OwnerRoute = router;
