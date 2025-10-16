import { TenantController } from "./tenant.controller";
import auth from "../../middlewares/authentication";
import hasRole from "../../middlewares/has-role";
import expressPromiseRouter from "express-promise-router";
import { FileUploadHelper } from "../../shared/cloudinaryHelper";

const router = expressPromiseRouter();

// Public routes - self-registration
router.post("/register", TenantController.createTenant);

// Protected routes - require authentication
router.get("/profile", auth, TenantController.getTenantByUserId);

// Support both PUT and PATCH for profile updates (backward compatibility)
router.put(
  "/profile",
  auth,
  FileUploadHelper.upload.single("profileImage"),
  TenantController.updateTenant
);
router.patch(
  "/profile",
  auth,
  FileUploadHelper.upload.single("profileImage"),
  TenantController.updateTenant
);

// Admin routes - require authentication and appropriate roles
router.post("/", auth, hasRole("admin"), TenantController.createTenant);
router.get("/", auth, hasRole("admin"), TenantController.getAllTenants);
router.get("/:id", auth, hasRole("admin"), TenantController.getTenantById);
router.put(
  "/:id",
  auth,
  hasRole("admin", "staff"),
  TenantController.updateTenant
);

// Admin-only routes - only admin can delete tenants
router.delete("/:id", auth, hasRole("admin"), TenantController.deleteTenant);

export const TenantRoute = router;
