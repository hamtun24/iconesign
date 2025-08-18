import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { XmlSignForm } from "../components/xml-sign-form";
import { ValidationForm } from "../components/validation-form";
import { QuickSignForm } from "../components/quick-sign-form";
import { FileSignature, ShieldCheck, Server, Zap } from "lucide-react";
import { useAuth } from "../contexts/AuthProvider";
import LogoutButton from "../components/LogoutButton";

export default function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Home.tsx mounted", { user, loading });
    
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      console.log("No user found in Home, redirecting to login");
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // If no user after loading is complete, the useEffect will handle redirect
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 text-black">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <FileSignature className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold">Service de signature XML Icone</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{user.email}</span>
            <LogoutButton />
            <Button onClick={() => navigate("/historique")}>Historique</Button>
            <Badge variant="secondary">v1.0.0</Badge>
            <Badge variant="outline">Prêt pour la production</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero */}
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Plateforme de signature numérique XML</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Signature et validation sécurisées de documents XML selon la norme XAdES-B avec intégration de l'autorité de certification TunTrust.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
            {[{
              icon: <FileSignature className="h-6 w-6 text-indigo-600" />,
              title: "Signature XAdES-B",
              desc: "Signatures numériques XML standard avec format enveloppé"
            }, {
              icon: <ShieldCheck className="h-6 w-6 text-green-600" />,
              title: "Validation de signature",
              desc: "Vérification complète de la signature avec rapports détaillés"
            }, {
              icon: <Zap className="h-6 w-6 text-yellow-500" />,
              title: "Signature rapide",
              desc: "Traitement par lot avec signature et validation automatiques"
            }, {
              icon: <Server className="h-6 w-6 text-blue-500" />,
              title: "Intégration TunTrust",
              desc: "Intégration sécurisée avec TunTrust HSM pour la signature basée sur certificat"
            }].map((feature, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-gray-100">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tabs */}
        <section className="max-w-4xl mx-auto">
          <Tabs defaultValue="quick-sign" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="quick-sign"><Zap className="h-4 w-4 mr-2" />Signature rapide</TabsTrigger>
              <TabsTrigger value="sign"><FileSignature className="h-4 w-4 mr-2" />Signer XML</TabsTrigger>
              <TabsTrigger value="validate"><ShieldCheck className="h-4 w-4 mr-2" />Valider</TabsTrigger>
            </TabsList>

            <TabsContent value="quick-sign" className="space-y-6"><QuickSignForm /></TabsContent>
            <TabsContent value="sign" className="space-y-6"><XmlSignForm /></TabsContent>
            <TabsContent value="validate" className="space-y-6"><ValidationForm /></TabsContent>
          </Tabs>
        </section>

        {/* Technical Specs */}
        <section className="max-w-4xl mx-auto mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2"><Zap className="h-5 w-5" /><span>Spécifications techniques</span></CardTitle>
              <CardDescription>Détails d'implémentation et normes supportées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Normes de signature</h4>
                  <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                    <li>XAdES-B (Signatures électroniques avancées XML)</li>
                    <li>Format de signature enveloppée</li>
                    <li>SHA-256 / RSA-SHA256</li>
                    <li>Certificat X.509</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Support de fichiers</h4>
                  <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                    <li>Format : XML (.xml)</li>
                    <li>Taille max : 10MB</li>
                    <li>Encodage : UTF-8</li>
                    <li>Support du traitement par lot</li>
                    <li>Téléchargement des fichiers signés</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-100 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-gray-600">
          <p>Service de signature XML XAdES • Développé avec Express.js, TypeScript et React</p>
          <p className="mt-2">Plateforme sécurisée de signature et validation de documents numériques</p>
        </div>
      </footer>
    </div>
  );
}