import { Link } from "react-router";

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-white"
    style={{
      backgroundImage:
        "radial-gradient(circle, rgba(0,0,0,0.2) 1.5px, transparent 1px)",
      backgroundSize: "20px 20px",
    }}
    >
      {/* Navigation */}
      <nav className="flex items-center justify-between px-12 py-6 bg-white">
        <div className="flex items-center gap-12">
          <h1 className="text-3xl font-bold">AnalysisNow</h1>
          <div className="flex items-center gap-8 text-base">
    
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-5 py-2.5 text-base hover:text-gray-600">
            Contact sales
          </button>
          <Link to="/canvas" className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-start px-12 pt-24 pb-32 " >
        {/* Integration Icons */}
        <div className="flex gap-4 mb-12">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 text-4xl">🩺</div>
          <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center text-green-700 text-4xl">🧬</div>
          <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-700 text-4xl">📊</div>
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center text-red-700 text-4xl">🌡️</div>
          <div className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-700 text-4xl">🧑‍⚕️</div>
        </div>

        {/* Headline */}
        <h2 className="text-7xl font-bold leading-tight mb-8 max-w-5xl">
          <span className="block opacity-0 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards] bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 bg-clip-text text-transparent">
            Visualize
          </span>
          <span className="block opacity-0 animate-[fadeInUp_0.8s_ease-out_0.5s_forwards] bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Analyze
          </span>
          <span className="block opacity-0 animate-[fadeInUp_0.8s_ease-out_0.8s_forwards] bg-gradient-to-r from-orange-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            Automate Data
          </span>
          <span className="block opacity-0 animate-[fadeInUp_0.8s_ease-out_1.1s_forwards] text-black font-extrabold drop-shadow-lg">
            Built for Clinicians and Public Health Researchers
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-2xl text-gray-600 mb-10 max-w-4xl">
          Everything you need – data, apps, and AI in an intuitive drag and drop interface to automate your workflows.
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-4">
          <Link to="/canvas" className="px-8 py-4 bg-blue-500 text-white text-lg rounded-xl hover:bg-blue-600">
            Get started
          </Link>
          <button className="px-8 py-4 bg-white text-black text-lg rounded-xl border-2 border-gray-200 hover:border-gray-300">
            Contact sales
          </button>
        </div>
      </main>
    </div>
  );
}
