import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

// Trata "desconhecido" (isInternetReachable ainda não resolvido, comum logo
// no boot do app) como online — evita mostrar o aviso de offline por engano
// só porque a checagem do NetInfo ainda não terminou.
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(
        state.isConnected !== false && state.isInternetReachable !== false,
      );
    });
    return () => unsubscribe();
  }, []);

  return isOnline;
}
