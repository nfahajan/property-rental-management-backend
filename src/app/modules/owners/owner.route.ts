import { OwnerController } from "./owner.controller";
import auth from "../../middlewares/authentication";
import hasRole from "../../middlewares/has-role";
import expressPromiseRouter from "express-promise-router";

const router = expressPromiseRouter();

// Public routes (if needed)
// router.post("/", OwnerController.createOwner); // Uncomment if owners can self-register

// Protected routes - require authentication
router.get("/profile", auth, OwnerController.getOwnerByUserId);
router.put("/profile", auth, OwnerController.updateOwner);

// Admin/Staff routes - require authentication and appropriate roles
router.post("/", auth, hasRole("admin", "staff"), OwnerController.createOwner);
router.get("/", auth, hasRole("admin", "staff"), OwnerController.getAllOwners);
router.get(
  "/stats",
  auth,
  hasRole("admin", "staff"),
  OwnerController.getOwnerStats
);
router.get(
  "/:id",
  auth,
  hasRole("admin", "staff"),
  OwnerController.getOwnerById
);
router.put(
  "/:id",
  auth,
  hasRole("admin", "staff"),
  OwnerController.updateOwner
);

// Admin-only routes - only admin can delete owners
router.delete("/:id", auth, hasRole("admin"), OwnerController.deleteOwner);

export const OwnerRoute = router;
