import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Lock, LogIn } from "lucide-react";
import { supabaseClient } from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import { Skeleton } from "../components/ui/skeleton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [authenticating, setAuthenticating] = useState(false);

  // Use user instead of session for consistency
  const { user, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthenticating(true);

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    setAuthenticating(false);

    if (error) {
      setError(error.message || "Échec de la connexion. Veuillez vérifier vos identifiants.");
    }
    // Note: No manual redirect here - useEffect will handle it when user state updates
  };

  useEffect(() => {
    console.log("Checking auth state on login page. User:", user, "Loading:", loading);
    
    // If not loading and user exists, redirect to dashboard
    if (!loading && user) {
      console.log("User authenticated, redirecting to dashboard. User:", user);
      navigate("/dashboard", { replace: true });
    } else if (!loading && !user) {
      console.log("No user found. User is not logged in.");
    }
  }, [user, loading, navigate]);

  // Show loading skeleton while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-6" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Connexion à IconeSign
          </CardTitle>
          <CardDescription>
            Accédez à la plateforme professionnelle de signature électronique XML sécurisée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">Adresse email</label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mot de passe</label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              disabled={authenticating}
            >
              <LogIn className="h-4 w-4" />
              {authenticating ? <Skeleton className="h-4 w-4" /> : "Se connecter"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Vous n'avez pas de compte ?{" "}
            <a href="/inscription" className="text-primary underline">
              Créer un compte
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}