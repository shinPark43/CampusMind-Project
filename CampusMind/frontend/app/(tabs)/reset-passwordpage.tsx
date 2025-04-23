import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { API_URL } from "@env";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      return Alert.alert("Passwords do not match.");
    }

    setLoading(true);

    try {
        const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Something went wrong");

      Alert.alert("Password reset successful!");
      Alert.alert("Success", "Password reset! You can now log in from the app.");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Enter your new password:</Text>
        <TextInput
          placeholder="New Password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.input}
          placeholderTextColor="#888"
        />
  
        <TextInput
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          placeholderTextColor="#888"
        />
  
        <Button
          title={loading ? "Resetting..." : "Reset Password"}
          onPress={handleReset}
          disabled={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center", // 👈 centers the form
        backgroundColor: "#0D1B2A",
      },
      
      form: {
        width: "90%",       // 👈 shrink to 90% of screen width
        maxWidth: 400,      // 👈 cap it on larger screens
      },
      
      title: {
        color: "white",
        fontSize: 18,
        textAlign: "center",
        marginBottom: 20,
      },
      
      input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: "#f9f9f9",
      },
      
});