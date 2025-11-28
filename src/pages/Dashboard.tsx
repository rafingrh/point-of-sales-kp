import { Card, Row, Col, Table, Typography, Spin, Empty, message } from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCartOutlined,
  AppstoreOutlined,
  TeamOutlined,
  DollarOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { supabase } from "../lib/supabase";
const { Text, Title } = Typography;

interface User {
  name: string;
  role_id: number;
}

interface Summary {
  totalSales: number;
  totalProducts: number;
  totalCashiers: number;
  totalStaff: number;
}

interface TransactionDisplay {
  key: string;
  no: number;
  kasir: string;
  produk: string;
  jumlah: number;
  total: string;
  tanggal: string;
}

interface SupabaseUser {
  name: string;
}

interface SupabaseProduct {
  name: string;
}

interface SupabaseTransactionItem {
  id: number;
  qty: number;
  price: number;
  subtotal: number;
  products?: SupabaseProduct;
}

interface SupabaseTransaction {
  id: number;
  total_amount: number;
  created_at: string;
  users?: SupabaseUser;
  transaction_items?: SupabaseTransactionItem[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({
    totalSales: 0,
    totalProducts: 0,
    totalCashiers: 0,
    totalStaff: 0,
  });
  const [transactions, setTransactions] = useState<TransactionDisplay[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch total products
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // Fetch total cashiers (role_id = 3)
      const { count: cashierCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role_id", 3);

      // Fetch total staff (role_id = 4)
      const { count: staffCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role_id", 4);

      // Fetch total sales from transactions
      const { data: transactionData } = await supabase
        .from("transactions")
        .select("*", { count: "exact" });

      const totalSales = transactionData?.length || 0;

      setSummary({
        totalSales,
        totalProducts: productCount || 0,
        totalCashiers: cashierCount || 0,
        totalStaff: staffCount || 0,
      });

      // Fetch recent transactions with related data
      const { data: recentTransactions, error } = await supabase
        .from("transactions")
        .select(
          `
          id,
          total_amount,
          created_at,
          users (
            name
          ),
          transaction_items (
            id,
            qty,
            price,
            subtotal,
            products (
              name
            )
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Format transactions for display - flatten transaction items
      const formattedTransactions: TransactionDisplay[] = [];
      let no = 1;

      if (recentTransactions) {
        recentTransactions.forEach((transaction) => {
          const typedTransaction =
            transaction as unknown as SupabaseTransaction;

          typedTransaction.transaction_items?.forEach((item) => {
            formattedTransactions.push({
              key: `${typedTransaction.id}-${item.id}`,
              no: no++,
              kasir: typedTransaction.users?.name || "Unknown",
              produk: item.products?.name || "Unknown",
              jumlah: item.qty,
              total: `Rp${item.subtotal.toLocaleString("id-ID")}`,
              tanggal: new Date(typedTransaction.created_at).toLocaleDateString(
                "id-ID"
              ),
            });
          });
        });
      }

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      message.error("Gagal mengambil data dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
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

  const columns = [
    { title: "No", dataIndex: "no", key: "no", width: 60 },
    { title: "Kasir", dataIndex: "kasir", key: "kasir" },
    { title: "Produk", dataIndex: "produk", key: "produk" },
    { title: "Jumlah", dataIndex: "jumlah", key: "jumlah", width: 100 },
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

  if (loading) {
    return (
      <div
        style={{
          padding: "24px",
          background: "linear-gradient(135deg, #f8f9ff 0%, #e0e7ff 100%)",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

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
        {transactions.length > 0 ? (
          <Table
            dataSource={transactions}
            columns={columns}
            pagination={false}
            style={{ borderRadius: "8px" }}
          />
        ) : (
          <Empty description="Tidak ada transaksi" />
        )}
      </Card>
    </div>
  );
}
