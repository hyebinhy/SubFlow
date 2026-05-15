import { Outlet } from "react-router-dom";
import FloatingDock from "./Sidebar";

export default function Layout() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[1600px] h-[95vh] sm:h-[90vh] bg-white/70 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/60 overflow-hidden flex flex-col relative z-10">
        <main className="flex-1 overflow-y-auto w-full h-full custom-scrollbar p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
      <div className="hidden sm:block">
        <FloatingDock />
      </div>
    </div>
  );
}
