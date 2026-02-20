import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleEnter = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      await signIn("demo@admin.com");
      toast({ title: "¡Bienvenido!", description: "Acceso al Dashboard (Demo)" });
      navigate("/admin");
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo acceder" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card-premium rounded-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold metallic-text">Admin Panel</h1>
            <p className="text-muted-foreground mt-2">Demo — acceso directo al dashboard</p>
          </div>

          <Button
            className="w-full"
            disabled={loading}
            onClick={handleEnter}
          >
            {loading ? (
              "Ingresando..."
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Acceder al Dashboard
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
