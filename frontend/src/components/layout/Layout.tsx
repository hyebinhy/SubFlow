import { Outlet } from "react-router-dom";
import FloatingDock from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="bg-mesh min-h-screen">
      <Header />
      <main className="relative z-10 p-6 pb-28">
        <Outlet />
      </main>
      <FloatingDock />
    </div>
  );
}
