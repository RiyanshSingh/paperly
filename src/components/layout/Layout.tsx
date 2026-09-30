import React from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Outlet, useLocation } from "react-router-dom";

export const Layout: React.FC = () => {
  const location = useLocation();
  const isEditor = location.pathname === '/edit-pdf';

  return (
    <div className="min-h-screen flex flex-col font-sans bg-black text-white selection:bg-white selection:text-black">
      {!isEditor && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      {!isEditor && <Footer />}
    </div>
  );
};
