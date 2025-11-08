export default {
  expo: {
    name: "CarbonChain Mobile",
    slug: "carbonchain-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/favicon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/favicon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/favicon.png",
        backgroundColor: "#FFFFFF"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    platforms: ["ios", "android", "web"]
  }
};
