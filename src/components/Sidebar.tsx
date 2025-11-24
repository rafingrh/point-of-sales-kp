import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Avatar, Typography, Divider } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  FileOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  TagOutlined,
  CreditCardOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import type { ReactNode } from "react";

const { Sider } = Layout;
const { Text } = Typography;

interface CustomMenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  roles: string[];
  children?: CustomMenuItem[];
}

export default function Sidebar() {
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
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => setCollapsed(!collapsed);

  const menuItems: CustomMenuItem[] = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
      roles: ["owner", "admin", "kasir", "staff"],
    },
    {
      key: "auth",
      icon: <TeamOutlined />,
      label: "Manajemen Pengguna",
      roles: ["owner", "admin"],
      children: [
        {
          key: "users",
          icon: <UserOutlined />,
          label: <Link to="/users">User</Link>,
          roles: ["owner", "admin"],
        },
        {
          key: "roles",
          icon: <TeamOutlined />,
          label: <Link to="/roles">Role</Link>,
          roles: ["owner", "admin"],
        },
      ],
    },
    {
      key: "products",
      icon: <AppstoreOutlined />,
      label: "Manajemen Produk",
      roles: ["owner", "admin"],
      children: [
        {
          key: "products-list",
          icon: <AppstoreOutlined />,
          label: <Link to="/products">Produk</Link>,
          roles: ["owner", "admin"],
        },
        {
          key: "categories",
          icon: <TagOutlined />,
          label: <Link to="/categories">Kategori</Link>,
          roles: ["owner", "admin"],
        },
        {
          key: "payment-methods",
          icon: <CreditCardOutlined />,
          label: <Link to="/payment-methods">Metode Pembayaran</Link>,
          roles: ["owner", "admin"],
        },
      ],
    },
    {
      key: "sales-management",
      icon: <ShoppingOutlined />,
      label: "Transaksi",
      roles: ["owner", "admin"],
      children: [
        {
          key: "sales",
          icon: <FileOutlined />,
          label: <Link to="/sales">Riwayat Penjualan</Link>,
          roles: ["owner", "admin"],
        },
      ],
    },
    {
      key: "sales-pos",
      icon: <ShoppingCartOutlined />,
      label: <Link to="/sales">Kasir (POS)</Link>,
      roles: ["kasir", "staff"],
    },
  ];

  // filter menu dan convert ke tipe MenuProps['items']
  const filteredMenu = (
    items: CustomMenuItem[],
    role: string
  ): MenuProps['items'] =>
    items
      .filter((item) => item.roles.includes(role))
      .map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        children: item.children ? filteredMenu(item.children, role) : undefined,
      }));

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      breakpoint="lg"
      collapsedWidth={80}
      width={260}
      style={{
        height: "100vh",
        position: "sticky",
        top: 0,
        boxShadow: "2px 0 8px rgba(0,0,0,0.08)",
        background: "#fff",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: collapsed ? "0" : "0 16px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "14px",
                color: "#fff",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              POS
            </div>
            <Text
              style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937" }}
            >
              Sistem POS
            </Text>
          </div>
        )}
        {collapsed && (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "14px",
              color: "#fff",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            POS
          </div>
        )}
      </div>

      {/* User Info */}
      {!collapsed && (
        <div
          style={{
            padding: "16px",
            background: "linear-gradient(135deg, #f8f9ff 0%, #e0e7ff 100%)",
            borderBottom: "1px solid #e0e7ff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Avatar
              size={44}
              icon={<UserOutlined />}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  display: "block",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#1f2937",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name || "User"}
              </Text>
              <Text
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                {roleDisplayMap[userRole] || "Staff"}
              </Text>
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div
          style={{
            padding: "16px 0",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Avatar
            size={44}
            icon={<UserOutlined />}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          />
        </div>
      )}

      <Divider style={{ margin: 0, borderColor: "#f0f0f0" }} />

      {/* Menu */}
      <div
        style={{
          height: `calc(100% - ${collapsed ? 152 : 188}px)`,
          overflowY: "auto",
          background: "#fff",
        }}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname.split("/")[1]]}
          items={filteredMenu(menuItems, userRole)}
          style={{
            borderRight: 0,
            paddingTop: "8px",
            background: "#fff",
          }}
        />
      </div>

      {/* Toggle Button */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "48px",
          borderTop: "1px solid #f0f0f0",
          background: "#fff",
        }}
      >
        <Button
          type="text"
          onClick={toggleCollapsed}
          style={{
            width: "100%",
            height: "100%",
            color: "#667eea",
            fontWeight: "500",
          }}
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        >
          {!collapsed && "Collapse"}
        </Button>
      </div>
    </Sider>
  );
}
