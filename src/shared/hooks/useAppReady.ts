import { tokenStorage } from "@/services/api/token";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";

export const useAppReady = () => {
  const [tokensInitialized, setTokensInitialized] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    "SFProDisplay-Regular": require("../../../assets/fonts/sf-pro-display/SFPRODISPLAYREGULAR.OTF"),
    "SFProDisplay-Medium": require("../../../assets/fonts/sf-pro-display/SFPRODISPLAYMEDIUM.OTF"),
    "SFProDisplay-Semibold": require("../../../assets/fonts/sf-pro-display/SFPRODISPLAYSEMIBOLDITALIC.OTF"),
    "SFProDisplay-Bold": require("../../../assets/fonts/sf-pro-display/SFPRODISPLAYBOLD.OTF"),
  });

  useEffect(() => {
    tokenStorage.init().finally(() => {
      setTokensInitialized(true);
    });
  }, []);

  useEffect(() => {
    if (fontError) {
      console.warn("Font loading error:", fontError);
    }
  }, [fontError]);

  return (fontsLoaded || !!fontError) && tokensInitialized;
};
