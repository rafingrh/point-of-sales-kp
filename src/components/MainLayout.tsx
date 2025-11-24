import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  return (
    <div className="flex h-screen">
      {/* Sidebar fixed height */}
      <Sidebar />

      {/* Konten utama */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
