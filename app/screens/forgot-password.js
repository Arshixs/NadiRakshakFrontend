import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PrimaryButton } from "../components/Button.js";
import Icon from "react-native-vector-icons/Feather";
import { BackendUrl } from "../../secrets.js";
import ToastComponent, { showToast } from "../components/Toast.js"; // Import Toast

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      showToast("error", "Error", "Please enter your email"); // Show error toast
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${BackendUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      showToast("success", "Success", "Password reset OTP sent to your email"); // Show success toast

      setTimeout(() => {
        router.replace({ pathname: "/screens/verify-reset-otp", params: { email: email } });
      }, 1500); // Slight delay to let the toast show
    } catch (error) {
      showToast("error", "Error", error.message); // Show error toast
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
              Enter your email, and we'll send you a password reset OTP.
            </Text>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-gray-50">
                <Icon name="mail" color="#4B5563" size={18} />
                <TextInput
                  className="flex-1 ml-2 text-base"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Reset Button */}
            <PrimaryButton
              title={loading ? "Sending..." : "Send Reset OTP"}
              onPress={handleResetPassword}
              disabled={loading}
              className="mb-4"
            />

            {/* Back to Login */}
            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-700">Remember your password? </Text>
              <Link href="/screens/login" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-600 font-semibold">Login</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast Component */}
      <ToastComponent />
    </SafeAreaView>
  );
}
