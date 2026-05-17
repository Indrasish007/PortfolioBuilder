import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import Button from "../components/Button.jsx";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-5 overflow-hidden">
      <div className="absolute inset-0 hero-bg pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-50 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative text-center max-w-md"
      >
        <div className="text-8xl md:text-[10rem] font-bold gradient-text leading-none">404</div>
        <h1 className="text-2xl font-bold mt-4">Page not found</h1>
        <p className="text-muted-foreground mt-2">We couldn't find what you're looking for. Let's get you back home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button as={Link} to="/"><Home className="w-4 h-4" /> Go home</Button>
          <Button variant="outline" onClick={() => history.back()}><ArrowLeft className="w-4 h-4" /> Back</Button>
        </div>
      </motion.div>
    </div>
  );
}
