import { TenantController } from "./tenant.controller";
import auth from "../../middlewares/authentication";
import hasRole from "../../middlewares/has-role";
import expressPromiseRouter from "express-promise-router";

const router = expressPromiseRouter();

// Public routes (if needed)
// router.post("/", TenantController.createTenant); // Uncomment if tenants can self-register

// Protected routes - require authentication
router.get("/profile", auth, TenantController.getTenantByUserId);
router.put("/profile", auth, TenantController.updateTenant);

// Admin/Staff routes - require authentication and appropriate roles
router.post(
  "/",
  auth,
  hasRole("admin", "staff"),
  TenantController.createTenant
);
router.get(
  "/",
  auth,
  hasRole("admin", "staff"),
  TenantController.getAllTenants
);
router.get(
  "/:id",
  auth,
  hasRole("admin", "staff"),
  TenantController.getTenantById
);
router.put(
  "/:id",
  auth,
  hasRole("admin", "staff"),
  TenantController.updateTenant
);

// Admin-only routes - only admin can delete tenants
router.delete("/:id", auth, hasRole("admin"), TenantController.deleteTenant);

export const TenantRoute = router;
