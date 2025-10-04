import express from "express";
import { AuthRoute } from "../modules/auth/auth.route";
import { TenantRoute } from "../modules/tenants/tenant.route";
import { OwnerRoute } from "../modules/owners/owner.route";
import { ApartmentRoute } from "../modules/apartments/apartment.route";
import { ApplicationRoute } from "../modules/applications/application.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoute,
  },
  {
    path: "/tenants",
    route: TenantRoute,
  },
  {
    path: "/owners",
    route: OwnerRoute,
  },
  {
    path: "/apartments",
    route: ApartmentRoute,
  },
  {
    path: "/applications",
    route: ApplicationRoute,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
