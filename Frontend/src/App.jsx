import { BrowserRouter, Routes, Route } from "react-router-dom";
import BottomNav from "./components/navbar/BottomNav";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Create from "./pages/Create";

export default function App() {
  return (
    <BrowserRouter>
      {/* App background */}
      <div className="min-h-screen bg-gray-50 flex justify-center">
        
        {/* App shell (Instagram style width) */}
        <div className="w-full max-w-md bg-white pb-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/create" element={<Create />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
