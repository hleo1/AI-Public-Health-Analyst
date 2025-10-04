import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    route("/api/data-processing", "routes/data-processing.tsx"),
    route("/", "routes/home.tsx"),
    route("/test", "routes/test.tsx")
] satisfies RouteConfig;
