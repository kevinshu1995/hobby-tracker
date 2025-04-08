import { Route, Routes } from "react-router";
import Home from "./pages/Home";

export default function App() {
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}
