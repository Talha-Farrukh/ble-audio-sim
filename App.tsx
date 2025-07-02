import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import DosmonoSDKDemo from "./components/DosmonoSDKDemo";
import DosmonoSDK from "./src/services/DosmonoSDK";

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={() => DosmonoSDK.requestPermissions()} style={styles.button}>
        <Text style={styles.buttonText}>Request Permissions</Text>
      </TouchableOpacity>
      </View>
      <DosmonoSDKDemo />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingVertical: 20,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40, // Extra bottom padding to ensure all content is accessible
  },
  button: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 20,
  },
});
