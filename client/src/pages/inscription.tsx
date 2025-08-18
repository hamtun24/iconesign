import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Alert, AlertDescription } from "../components/ui/alert";
import { UserPlus } from "lucide-react";
import { supabaseClient } from "../utils/supabaseClient";
import { useNavigate  } from "react-router-dom";


export default function InscriptionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password || !confirm) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    try {
      const { error } = await supabaseClient.auth.signUp({ email, password });
      if (error) {
        setError(error.message || "Échec de l'inscription.");
      } else {
       navigate("/", { replace: true });
      }
    } catch (err) {
      setError("Impossible de contacter le serveur d'authentification. Vérifiez votre connexion ou la configuration supabaseClient.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Inscription
          </CardTitle>
          <CardDescription>
            Créez un compte pour accéder à la plateforme professionnelle de signature XML.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium mb-1">Adresse email</label>
              <Input
                type="email"
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
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirmer le mot de passe</label>
              <Input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirmez le mot de passe"
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full flex items-center justify-center gap-2">
              <UserPlus className="h-4 w-4" />
              S'inscrire
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Déjà inscrit ? <a href="/" className="text-primary underline">Connectez-vous</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
