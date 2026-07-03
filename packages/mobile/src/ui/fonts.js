// fonts.js — the font faces bundled into the app, loaded once in App.js via
// expo-font's useFonts. The keys are the RN family names referenced through
// @macro/core/theme `fonts` (and by the <Text> wrapper's weight mapping).
//
// We require each .ttf by its exact subpath rather than importing from the
// package index — the index eagerly `require`s every weight, which would bundle
// ~100 unused font files. Web uses Fraunces for its serif display + all
// `.numeric` big numbers, Inter for body, and JetBrains Mono for chart axes.
export const fontMap = {
  Inter_400Regular: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
  Inter_500Medium: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
  Inter_600SemiBold: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
  Fraunces_400Regular: require('@expo-google-fonts/fraunces/400Regular/Fraunces_400Regular.ttf'),
  Fraunces_500Medium: require('@expo-google-fonts/fraunces/500Medium/Fraunces_500Medium.ttf'),
  Fraunces_400Regular_Italic: require('@expo-google-fonts/fraunces/400Regular_Italic/Fraunces_400Regular_Italic.ttf'),
  Fraunces_500Medium_Italic: require('@expo-google-fonts/fraunces/500Medium_Italic/Fraunces_500Medium_Italic.ttf'),
  JetBrainsMono_400Regular: require('@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf'),
};
