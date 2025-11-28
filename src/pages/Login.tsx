// Login.tsx
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { UserOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);

    try {
      // 1. Login menggunakan fungsi RPC yang sudah ada
      const { data: userData, error: rpcError } = await supabase.rpc(
        "login_user",
        {
          p_email: values.email,
          p_password: values.password,
        }
      );

      if (rpcError || !userData || userData.length === 0) {
        message.error("Email atau password salah!");
        setLoading(false);
        return;
      }

      const user = userData[0];
      console.log("USER:", user);

      // 2. Simpan user data ke localStorage (untuk backward compatibility)
      localStorage.setItem("user", JSON.stringify(user));

      // 3. PENTING: Sign in ke Supabase Auth juga
      // Ini membuat supabase.auth.getUser() bisa berfungsi
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) {
        console.error("Supabase Auth Error:", signInError);
        // Tetap lanjut karena login RPC sudah berhasil
        // Auth sign in hanya untuk compatibility dengan sistem lain
      }

      message.success("Login berhasil!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      message.error("Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      {/* Decorative Background Elements */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          filter: "blur(80px)",
        }}
      />

      <Card
        style={{
          width: "100%",
          maxWidth: "440px",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          position: "relative",
          zIndex: 1,
        }}
        bodyStyle={{ padding: "40px" }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: "bold",
              color: "#fff",
              boxShadow: "0 8px 20px rgba(102, 126, 234, 0.4)",
            }}
          >
            POS
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
            Selamat Datang
          </Title>
          <Text style={{ fontSize: "14px", color: "#6b7280" }}>
            Silakan login untuk melanjutkan
          </Text>
        </div>

        {/* Form */}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={
              <span style={{ fontWeight: "500", color: "#374151" }}>Email</span>
            }
            name="email"
            rules={[{ required: true, message: "Email wajib diisi" }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#9ca3af" }} />}
              type="email"
              placeholder="Masukkan email"
              size="large"
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            />
          </Form.Item>

          <Form.Item
            label={
              <span style={{ fontWeight: "500", color: "#374151" }}>
                Password
              </span>
            }
            name="password"
            rules={[{ required: true, message: "Password wajib diisi" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#9ca3af" }} />}
              placeholder="Masukkan password"
              size="large"
              style={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            icon={<LoginOutlined />}
            style={{
              marginTop: "16px",
              height: "48px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              fontSize: "16px",
              fontWeight: "600",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
            }}
          >
            {loading ? "Memproses..." : "Login"}
          </Button>
        </Form>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Text style={{ fontSize: "13px", color: "#9ca3af" }}>
            © 2025 Sistem POS. All rights reserved.
          </Text>
        </div>
      </Card>
    </div>
  );
}
