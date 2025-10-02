import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), 
    route("/api/load-dataframe", "routes/loadDataframe.tsx")
] satisfies RouteConfig;
