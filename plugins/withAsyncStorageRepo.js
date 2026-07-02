const { withProjectBuildGradle } = require("@expo/config-plugins");

// O async-storage v3 distribui a dependência 'org.asyncstorage.shared_storage'
// em um repositório Maven local dentro do próprio pacote npm.
// Este plugin adiciona esse repositório ao build.gradle automaticamente.
const withAsyncStorageRepo = (config) =>
  withProjectBuildGradle(config, (mod) => {
    const marker = "maven { url 'https://www.jitpack.io' }";
    const injection = `maven { url "$rootDir/../node_modules/@react-native-async-storage/async-storage/android/local_repo" }`;

    if (!mod.modResults.contents.includes("async-storage/android/local_repo")) {
      mod.modResults.contents = mod.modResults.contents.replace(
        marker,
        `${marker}\n    ${injection}`,
      );
    }
    return mod;
  });

module.exports = withAsyncStorageRepo;
