function Icon({ text }: { text: string }) {
    return (
      <div className="w-15 h-15 border border-black rounded-xl flex items-center justify-center text-center cursor-pointer">
        {text}
      </div>
    );
  }

export default function SideBar() {
    return(
     
              <div className="absolute left-2 top-1/2 -translate-y-1/2 h-100 w-20 bg-white rounded-xl border border-black  gap-3 py-10 shadow-xl flex flex-col items-center text-sm">
                <Icon text="Data Source"></Icon>
                <Icon text="Get Columns"></Icon>
                <Icon text="Extract Info"></Icon>
                <Icon text="Select"></Icon>
              </div>
            
        
    )
}