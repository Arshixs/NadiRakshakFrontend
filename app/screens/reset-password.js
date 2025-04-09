import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import ToastComponent, { showToast } from "../components/Toast"; // Toast Component
import { PrimaryButton } from "../components/Button"; // Reusable Button
import Icon from "react-native-vector-icons/Feather"; 
import { BackendUrl } from "../../secrets.js";

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      showToast("error", "Invalid Password", "Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("error", "Password Mismatch", "Both passwords must be the same.");
      return;
    }

    setLoading(true);
    try {
      // Get verification token from SecureStore
      const verificationToken = await SecureStore.getItemAsync("verificationToken");
      if (!verificationToken) {
        showToast("error", "Error", "Verification token is missing. Please verify OTP again.");
        return;
      }

      const response = await fetch(`${BackendUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ verificationToken, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("success", "Success", "Password reset successfully! Redirecting...");
        setTimeout(() => router.push("/screens/login"), 1500);
      } else {
        showToast("error", "Error", data.message || "Failed to reset password.");
      }
    } catch (error) {
      showToast("error", "Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white p-6 rounded-xl shadow-sm">
            {/* Title */}
            <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Reset Password
            </Text>
            <Text className="text-gray-600 text-sm text-center mb-6">
              Enter your new password below.
            </Text>

            {/* New Password Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">New Password</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-gray-50">
                <Icon name="lock" color="#4B5563" size={18} />
                <TextInput
                  className="flex-1 ml-2 text-base"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Confirm Password Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Confirm Password</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-gray-50">
                <Icon name="lock" color="#4B5563" size={18} />
                <TextInput
                  className="flex-1 ml-2 text-base"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Reset Button */}
            <PrimaryButton
              title={loading ? "Resetting..." : "Reset Password"}
              onPress={handleResetPassword}
              disabled={loading}
              className="mb-4"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast Component */}
      <ToastComponent />
    </SafeAreaView>
  );
}
