import { Card, Row, Col, Table, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCartOutlined,
  AppstoreOutlined,
  TeamOutlined,
  DollarOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();

  const [user] = useState<{ name: string; role_id: number } | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  if (!user) {
    navigate("/", { replace: true });
    return null;
  }

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

  const summary = {
    totalSales: 120,
    totalProducts: 45,
    totalCashiers: 5,
    totalStaff: 8,
  };

  const transactions = [
    {
      key: 1,
      kasir: "Kasir Toko",
      produk: "Produk A",
      jumlah: 2,
      total: "Rp50.000",
      tanggal: "24/11/2025",
    },
    {
      key: 2,
      kasir: "Kasir Toko",
      produk: "Produk B",
      jumlah: 1,
      total: "Rp30.000",
      tanggal: "24/11/2025",
    },
  ];

  const columns = [
    { title: "ID", dataIndex: "key", key: "key" },
    { title: "Kasir", dataIndex: "kasir", key: "kasir" },
    { title: "Produk", dataIndex: "produk", key: "produk" },
    { title: "Jumlah", dataIndex: "jumlah", key: "jumlah" },
    { title: "Total", dataIndex: "total", key: "total" },
    { title: "Tanggal", dataIndex: "tanggal", key: "tanggal" },
  ];

  const summaryCards = [
    {
      title: "Total Penjualan",
      value: summary.totalSales,
      icon: <DollarOutlined style={{ fontSize: "32px" }} />,
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      title: "Total Produk",
      value: summary.totalProducts,
      icon: <AppstoreOutlined style={{ fontSize: "32px" }} />,
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      title: "Total Kasir",
      value: summary.totalCashiers,
      icon: <ShoppingCartOutlined style={{ fontSize: "32px" }} />,
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
    {
      title: "Total Staff",
      value: summary.totalStaff,
      icon: <TeamOutlined style={{ fontSize: "32px" }} />,
      gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    },
  ];

  return (
    <div
      style={{
        padding: "24px",
        background: "linear-gradient(135deg, #f8f9ff 0%, #e0e7ff 100%)",
        minHeight: "100vh",
      }}
    >
      {/* Welcome Header */}
      <div
        style={{
          marginBottom: "24px",
          padding: "24px",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
          Selamat datang, {user.name}! 👋
        </Title>
        <Text style={{ fontSize: "16px", color: "#6b7280" }}>
          Role:{" "}
          <span style={{ fontWeight: "600", color: "#667eea" }}>
            {roleDisplayMap[userRole]}
          </span>
        </Text>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        {summaryCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              bordered={false}
              style={{
                borderRadius: "12px",
                background: card.gradient,
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.15)",
                overflow: "hidden",
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <Text
                    style={{
                      display: "block",
                      color: "rgba(255, 255, 255, 0.9)",
                      fontSize: "14px",
                      fontWeight: "500",
                      marginBottom: "8px",
                    }}
                  >
                    {card.title}
                  </Text>
                  <Text
                    style={{
                      display: "block",
                      color: "#fff",
                      fontSize: "32px",
                      fontWeight: "700",
                    }}
                  >
                    {card.value}
                  </Text>
                </div>
                <div
                  style={{
                    color: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Recent Transactions */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShoppingOutlined style={{ color: "#667eea", fontSize: "20px" }} />
            <span style={{ color: "#1f2937", fontWeight: "600" }}>
              Transaksi Terbaru
            </span>
          </div>
        }
        bordered={false}
        style={{
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Table
          dataSource={transactions}
          columns={columns}
          pagination={false}
          style={{ borderRadius: "8px" }}
        />
      </Card>
    </div>
  );
}
