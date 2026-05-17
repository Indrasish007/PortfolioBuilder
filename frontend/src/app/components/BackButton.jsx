import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Button from "./Button.jsx";

export default function BackButton({ className = "", fallback = "/dashboard", fixed = false }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  const baseClasses = fixed 
    ? "fixed top-4 left-4 z-50 shadow-md bg-background/80 backdrop-blur-md" 
    : "mb-4";

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleBack} 
      className={`${baseClasses} ${className} flex items-center gap-2`}
    >
      <ArrowLeft className="w-4 h-4" /> Back
    </Button>
  );
}
