import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function ProtectedLayout() {
  return (
    <>
      <div className="app-shell">
        <Navbar />
        <main>
          <Outlet />
        </main>
      </div>
    </>
  );
}
