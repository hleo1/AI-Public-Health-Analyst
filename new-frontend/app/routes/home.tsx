import type { Route } from "./+types/home";
import { useEffect } from "react";


function Icon({text } : {text: string}) {
  return(<div className="w-15 h-15 border border-black rounded-xl flex items-center justify-center text-center cursor-pointer">
    {text}
  </div>)
}

function DataSourceBlock() {
  return(<div className="w-60 h-30 top-20 bg-white rounded-xl border border-black text-center flex items-center justify-center">
    Data Source
    </div>)
}

function FindBlock() {
  return(<div className="w-60 h-30 top-20 bg-white rounded-xl border border-black text-center flex items-center justify-center">
    Find Block
    </div>)
}

function ExtractInfoBlock() {
  return(<div className="w-60 h-30 top-20 bg-white rounded-xl border border-black text-center flex items-center justify-center">
    Extract Info
    </div>)
}

function SelectBlock() {
  return(<div className="w-60 h-30 top-20 bg-white rounded-xl border border-black text-center flex items-center justify-center">
    Select
    </div>)
}



function SideBar() {
 return(<div className="absolute left-2 top-1/2 -translate-y-1/2 h-100 w-20 bg-white rounded-xl border border-black  gap-3 py-10 shadow-xl flex flex-col items-center text-sm">
  <Icon text = "Data Source"></Icon>
  <Icon text = "Get Columns"></Icon>
  <Icon text = "Extract Info"></Icon>
  <Icon text = "Select"></Icon>
</div>
)
}


export default function Home() {
  return (<div className="w-full min-h-screen" 
  style = {{backgroundImage : "radial-gradient(circle, rgba(0,0,0,0.2) 1.5px, transparent 1px)", backgroundSize: "20px 20px"}}
  > 
  <div className = "flex gap-5">
  <DataSourceBlock/>
  <FindBlock/>
  <ExtractInfoBlock/>
  <SelectBlock/>
  </div>
    <SideBar/>
    
  </div>);
}
