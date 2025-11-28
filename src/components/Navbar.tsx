import { Button, Avatar, Typography } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function Navbar() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const roleMap: Record<number, string> = {
    1: "owner",
    2: "admin",
    3: "kasir",
    4: "staff",
  };

  const roleDisplayMap: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    kasir: "Kasir",
    staff: "Staff",
  };

  const userRole = roleMap[user.role_id];

  return (
    <nav
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        boxShadow: "0 2px 8px rgba(102, 126, 234, 0.15)",
        padding: "0 24px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontWeight: "bold",
            color: "#fff",
            border: "2px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          POS
        </div>
        <Text
          style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#fff",
            letterSpacing: "0.5px",
          }}
        >
          POS
        </Text>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            padding: "8px 16px",
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Avatar
            size={32}
            icon={<UserOutlined />}
            style={{
              background: "rgba(255, 255, 255, 0.9)",
              color: "#667eea",
            }}
          />
          <div>
            <Text
              style={{
                display: "block",
                color: "#fff",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              {user.name || "User"}
            </Text>
            <Text
              style={{
                display: "block",
                color: "rgba(255, 255, 255, 0.8)",
                fontSize: "12px",
              }}
            >
              {roleDisplayMap[userRole] || "Staff"}
            </Text>
          </div>
        </div>

        <Button
          onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/";
          }}
          icon={<LogoutOutlined />}
          style={{
            background: "rgba(239, 68, 68, 0.9)",
            border: "none",
            color: "#fff",
            fontWeight: "600",
            height: "40px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          Logout
        </Button>
      </div>
    </nav>
  );
}
