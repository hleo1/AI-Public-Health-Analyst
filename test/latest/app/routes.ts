import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    // index("routes/home.tsx"),
    route("/", "routes/home.tsx"),
    route("/test" ,"routes/test.tsx"),
    route("/extract", "routes/extract.tsx")
] satisfies RouteConfig;
