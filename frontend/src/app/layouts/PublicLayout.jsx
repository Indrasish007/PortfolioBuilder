import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function PublicLayout() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 relative z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
