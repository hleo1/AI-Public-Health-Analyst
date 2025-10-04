import type { Route } from "./+types/home";
import { PannableBackground } from "../components/PannableBackground";
import { DataLoaderBlock } from "../components/DataLoaderBlock";

export default function Canvas() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-100">
      <PannableBackground>
        {({ offset }) => (
          <>
            <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-2 rounded-md shadow border text-sm">
              x: {Math.round(offset.x)} | y: {Math.round(offset.y)}
            </div>
            <DataLoaderBlock />
          </>
        )}
      </PannableBackground>
    </div>
  );
}


// export function meta({}: Route.MetaArgs) {
//   return [
//     { title: "New React Router App" },
//     { name: "description", content: "Welcome to React Router!" },
//   ];
// }

// export default function Home() {
//   return <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
//   {/* Canvas with dotted background */}
//   <div
//     className="relative w-full h-full"
//     style={{
//       backgroundImage:
//         "radial-gradient(circle, rgba(0,0,0,0.2) 1px, transparent 1px)",
//       backgroundSize: "20px 20px",
//     }}
//   >
//     {/* Example Block */}
//     <div className="absolute top-20 left-20 p-4 w-64 rounded-2xl shadow-lg bg-white border border-gray-200">
//       <h2 className="font-semibold text-lg mb-2">📂 Data Block</h2>
//       <p className="text-sm text-gray-600">Upload a file here</p>
//     </div>
//   </div>
// </div>;
// }
