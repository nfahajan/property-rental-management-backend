import { ApplicationController } from "./application.controller";
import auth from "../../middlewares/authentication";
import hasRole from "../../middlewares/has-role";
import { handleFileData } from "../../shared/handleFileData";
import expressPromiseRouter from "express-promise-router";

const router = expressPromiseRouter();

// Tenant routes - tenants can create and manage their own applications
router.post(
  "/",
  auth,
  hasRole("tenant"),
  handleFileData.fields([
    { name: "idProof", maxCount: 1 },
    { name: "incomeProof", maxCount: 1 },
    { name: "bankStatement", maxCount: 1 },
    { name: "references", maxCount: 5 },
  ]),
  ApplicationController.createApplication
);

router.get(
  "/my-applications",
  auth,
  hasRole("tenant"),
  ApplicationController.getApplicationsByTenant
);
router.get("/:id", auth, ApplicationController.getApplicationById);
router.put(
  "/:id",
  auth,
  hasRole("tenant"),
  handleFileData.fields([
    { name: "idProof", maxCount: 1 },
    { name: "incomeProof", maxCount: 1 },
    { name: "bankStatement", maxCount: 1 },
    { name: "references", maxCount: 5 },
  ]),
  ApplicationController.updateApplication
);
router.delete(
  "/:id",
  auth,
  hasRole("tenant"),
  ApplicationController.deleteApplication
);

// Owner routes - owners can view and review applications for their apartments
router.get(
  "/owner/my-apartments-applications",
  auth,
  hasRole("owner"),
  ApplicationController.getApplicationsByOwner
);
router.patch(
  "/:id/review",
  auth,
  hasRole("owner"),
  ApplicationController.reviewApplication
);

// Admin/Staff routes - can manage all applications
router.get(
  "/",
  auth,
  hasRole("admin", "staff"),
  ApplicationController.getAllApplications
);
router.patch(
  "/admin/:id/review",
  auth,
  hasRole("admin", "staff"),
  ApplicationController.reviewApplication
);
router.delete(
  "/admin/:id",
  auth,
  hasRole("admin"),
  ApplicationController.deleteApplication
);
router.get(
  "/admin/stats",
  auth,
  hasRole("admin", "staff"),
  ApplicationController.getApplicationStats
);

export const ApplicationRoute = router;
