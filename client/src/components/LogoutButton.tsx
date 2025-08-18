import { supabaseClient } from "../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    navigate("/login");
  };

  return (
    <Button onClick={handleLogout} variant="outline">
      Se déconnecter
    </Button>
  );
}
