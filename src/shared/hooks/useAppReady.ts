import { useFonts } from "expo-font";
import { useEffect } from "react";

export const useAppReady = () => {
  const [fontsLoaded, fontError] = useFonts({
    "SFProDisplay-Regular": require("../../../assets/fonts/sf-pro-display/SFPRODISPLAYREGULAR.otf"),
    "SFProDisplay-Medium": require("../../../assets/fonts/sf-pro-display/SFPRODISPLAYMEDIUM.otf"),
    "SFProDisplay-Semibold": require("../../../assets/fonts/sf-pro-display/SFPRODISPLAYSEMIBOLDITALIC.otf"),
    "SFProDisplay-Bold": require("../../../assets/fonts/sf-pro-display/SFPRODISPLAYBOLD.otf"),
  });

  useEffect(() => {
    if (fontError) {
      console.warn("Font loading error:", fontError);
    }
  }, [fontError]);

  return fontsLoaded || !!fontError;
};
