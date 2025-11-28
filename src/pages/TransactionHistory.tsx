import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  DatePicker,
  Select,
  Row,
  Col,
  Modal,
  Divider,
  Statistic,
  Empty,
  message,
  Space,
  Input,
  Spin,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  FilterOutlined,
  PrinterOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { supabase } from "../lib/supabase";
import dayjs, { Dayjs } from "dayjs";
import * as XLSX from "xlsx";

const { RangePicker } = DatePicker;

interface Transaction {
  id: number;
  user_id: number;
  payment_method_id: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  created_at: string;
  user_name?: string;
  payment_method_name?: string;
}

interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  qty: number;
  price: number;
  subtotal: number;
  product_name?: string;
}

interface TransactionDetail extends Transaction {
  items: TransactionItem[];
}

interface SupabaseUser {
  name: string;
}

interface SupabasePaymentMethod {
  name: string;
}

interface SupabaseTransaction {
  id: number;
  user_id: number;
  payment_method_id: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  created_at: string;
  users?: SupabaseUser;
  payment_methods?: SupabasePaymentMethod;
}

interface SupabaseProduct {
  name: string;
}

interface SupabaseTransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  qty: number;
  price: number;
  subtotal: number;
  products?: SupabaseProduct;
}

type DateRangeValue = [Dayjs | null, Dayjs | null] | null;

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionDetail | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    number | null
  >(null);
  const [paymentMethods, setPaymentMethods] = useState<
    { id: number; name: string }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    totalItems: 0,
  });

  useEffect(() => {
    fetchTransactions();
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, dateRange, selectedPaymentMethod, searchQuery]);

  const fetchPaymentMethods = async () => {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching payment methods:", error);
    } else {
      setPaymentMethods(data || []);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data: transactionsData, error } = await supabase
        .from("transactions")
        .select(
          `
          *,
          users(name),
          payment_methods(name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData =
        transactionsData?.map((t: SupabaseTransaction) => ({
          id: t.id,
          user_id: t.user_id,
          payment_method_id: t.payment_method_id,
          total_amount: t.total_amount,
          paid_amount: t.paid_amount,
          change_amount: t.change_amount,
          created_at: t.created_at,
          user_name: t.users?.name || "Unknown",
          payment_method_name: t.payment_methods?.name || "Unknown",
        })) || [];

      setTransactions(formattedData);
      calculateStats(formattedData);
      message.success("Data transaksi berhasil dimuat");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      message.error(`Gagal mengambil data transaksi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((t) => {
        const transactionDate = dayjs(t.created_at);
        return (
          transactionDate.isAfter(dateRange[0]) &&
          transactionDate.isBefore(dateRange[1]?.add(1, "day"))
        );
      });
    }

    if (selectedPaymentMethod) {
      filtered = filtered.filter(
        (t) => t.payment_method_id === selectedPaymentMethod
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.id.toString().includes(searchQuery) ||
          t.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (data: Transaction[]) => {
    const totalTransactions = data.length;
    const totalRevenue = data.reduce(
      (sum, t) => sum + Number(t.total_amount),
      0
    );

    setStats({
      totalTransactions,
      totalRevenue,
      totalItems: data.reduce((sum) => sum + 1, 0),
    });
  };

  const handleViewDetail = async (transaction: Transaction) => {
    try {
      const { data: itemsData, error } = await supabase
        .from("transaction_items")
        .select(
          `
          *,
          products(name)
        `
        )
        .eq("transaction_id", transaction.id);

      if (error) throw error;

      const formattedItems =
        itemsData?.map((item: SupabaseTransactionItem) => ({
          id: item.id,
          transaction_id: item.transaction_id,
          product_id: item.product_id,
          qty: item.qty,
          price: item.price,
          subtotal: item.subtotal,
          product_name: item.products?.name || "Unknown Product",
        })) || [];

      setSelectedTransaction({
        ...transaction,
        items: formattedItems,
      });
      setDetailModalVisible(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      message.error(`Gagal mengambil detail transaksi: ${errorMessage}`);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      const headers = [
        "ID Transaksi",
        "Tanggal",
        "Waktu",
        "Kasir",
        "Total",
        "Pembayaran",
        "Kembalian",
      ];
      const rows = filteredTransactions.map((t) => [
        `#TRX${t.id.toString().padStart(6, "0")}`,
        dayjs(t.created_at).format("DD/MM/YYYY"),
        dayjs(t.created_at).format("HH:mm:ss"),
        t.user_name,
        t.total_amount,
        t.payment_method_name,
        t.change_amount,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" && cell.includes(",")
                ? `"${cell}"`
                : cell
            )
            .join(",")
        ),
      ].join("\n");

      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent)
      );
      element.setAttribute(
        "download",
        `laporan_transaksi_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.csv`
      );
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      message.success("Data berhasil diexport ke CSV");
    } catch (error) {
      console.log(error);

      message.error("Gagal mengexport data");
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = () => {
    setExporting(true);
    try {
      const data = filteredTransactions.map((t) => ({
        "ID Transaksi": `#TRX${t.id.toString().padStart(6, "0")}`,
        Tanggal: dayjs(t.created_at).format("DD/MM/YYYY"),
        Waktu: dayjs(t.created_at).format("HH:mm:ss"),
        Kasir: t.user_name,
        Total: Number(t.total_amount),
        Pembayaran: t.payment_method_name,
        Kembalian: Number(t.change_amount),
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transaksi");

      ws["!cols"] = [
        { wch: 18 },
        { wch: 14 },
        { wch: 12 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
      ];

      XLSX.writeFile(
        wb,
        `laporan_transaksi_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.xlsx`
      );
      message.success("Data berhasil diexport ke Excel");
    } catch (error) {
      console.error("Export error:", error);
      message.error("Gagal mengexport data ke Excel");
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setDateRange(null);
    setSelectedPaymentMethod(null);
    setSearchQuery("");
  };

  const columns = [
    {
      title: "ID Transaksi",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (id: number) => (
        <span style={{ fontWeight: "600", color: "#667eea" }}>
          #TRX{id.toString().padStart(6, "0")}
        </span>
      ),
    },
    {
      title: "Tanggal & Waktu",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date: string) => (
        <div>
          <div style={{ fontWeight: "500" }}>
            {dayjs(date).format("DD MMM YYYY")}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {dayjs(date).format("HH:mm:ss")}
          </div>
        </div>
      ),
    },
    {
      title: "Kasir",
      dataIndex: "user_name",
      key: "user_name",
      width: 150,
    },
    {
      title: "Total",
      dataIndex: "total_amount",
      key: "total_amount",
      width: 150,
      render: (amount: number) => (
        <span style={{ fontWeight: "600", fontSize: "14px", color: "#000" }}>
          Rp {Number(amount).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Pembayaran",
      dataIndex: "payment_method_name",
      key: "payment_method_name",
      width: 130,
      render: (method: string) => (
        <Tag color="blue" style={{ borderRadius: "4px", fontSize: "12px" }}>
          {method}
        </Tag>
      ),
    },
    {
      title: "Kembalian",
      dataIndex: "change_amount",
      key: "change_amount",
      width: 120,
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? "#52c41a" : "#666" }}>
          Rp {Number(amount).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      fixed: "right" as const,
      render: (_: unknown, record: Transaction) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
          }}
        >
          Detail
        </Button>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #f5f7fa, #e9ecf1)",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "8px",
            }}
          >
            Riwayat Transaksi
          </h1>
          <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
            Kelola dan pantau semua transaksi penjualan
          </p>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: "24px" }}>
          <Col xs={24} sm={8}>
            <Card
              style={{
                borderRadius: "12px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
              }}
              bodyStyle={{ padding: "20px" }}
            >
              <Statistic
                title={
                  <span
                    style={{ color: "#fff", opacity: 0.9, fontSize: "13px" }}
                  >
                    Total Transaksi
                  </span>
                }
                value={stats.totalTransactions}
                prefix={<ShoppingCartOutlined style={{ color: "#fff" }} />}
                valueStyle={{ color: "#fff", fontWeight: "bold" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              style={{
                borderRadius: "12px",
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                border: "none",
              }}
              bodyStyle={{ padding: "20px" }}
            >
              <Statistic
                title={
                  <span
                    style={{ color: "#fff", opacity: 0.9, fontSize: "13px" }}
                  >
                    Total Pendapatan
                  </span>
                }
                value={stats.totalRevenue}
                prefix={<DollarOutlined style={{ color: "#fff" }} />}
                valueStyle={{ color: "#fff", fontWeight: "bold" }}
                formatter={(value) => `Rp ${Number(value).toLocaleString()}`}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              style={{
                borderRadius: "12px",
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                border: "none",
              }}
              bodyStyle={{ padding: "20px" }}
            >
              <Statistic
                title={
                  <span
                    style={{ color: "#fff", opacity: 0.9, fontSize: "13px" }}
                  >
                    Rata-rata Transaksi
                  </span>
                }
                value={
                  stats.totalTransactions > 0
                    ? stats.totalRevenue / stats.totalTransactions
                    : 0
                }
                prefix={<CalendarOutlined style={{ color: "#fff" }} />}
                valueStyle={{ color: "#fff", fontWeight: "bold" }}
                formatter={(value) => `Rp ${Number(value).toLocaleString()}`}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card
          style={{
            borderRadius: "12px",
            marginBottom: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
          bodyStyle={{ padding: "20px" }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={24} md={6}>
              <Input
                size="large"
                placeholder="Cari ID Transaksi atau Kasir..."
                prefix={<SearchOutlined style={{ color: "#667eea" }} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                style={{ borderRadius: "8px" }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <RangePicker
                size="large"
                style={{ width: "100%", borderRadius: "8px" }}
                placeholder={["Tanggal Mulai", "Tanggal Akhir"]}
                format="DD/MM/YYYY"
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
              />
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Select
                size="large"
                placeholder="Metode Pembayaran"
                style={{ width: "100%", borderRadius: "8px" }}
                value={selectedPaymentMethod}
                onChange={setSelectedPaymentMethod}
                allowClear
              >
                {paymentMethods.map((method) => (
                  <Select.Option key={method.id} value={method.id}>
                    {method.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={24} md={7}>
              <Space wrap style={{ width: "100%" }}>
                <Button
                  size="large"
                  icon={<FilterOutlined />}
                  onClick={resetFilters}
                  style={{ borderRadius: "8px" }}
                >
                  Reset
                </Button>
                <Button
                  size="large"
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={fetchTransactions}
                  loading={loading}
                  style={{
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                  }}
                >
                  Refresh
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Export Buttons */}
        <Card
          style={{
            borderRadius: "12px",
            marginBottom: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
          bodyStyle={{ padding: "16px" }}
        >
          <Space wrap>
            <span style={{ fontWeight: "600", color: "#333" }}>
              Export Data:
            </span>
            <Button
              icon={<FileExcelOutlined />}
              onClick={exportToExcel}
              loading={exporting}
              disabled={filteredTransactions.length === 0}
              style={{ borderRadius: "8px" }}
            >
              Export Excel
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportToCSV}
              loading={exporting}
              disabled={filteredTransactions.length === 0}
              style={{ borderRadius: "8px" }}
            >
              Export CSV
            </Button>
          </Space>
        </Card>

        {/* Table */}
        <Card
          style={{
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
          bodyStyle={{ padding: "0" }}
        >
          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={filteredTransactions}
              rowKey="id"
              loading={false}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} transaksi`,
              }}
              scroll={{ x: 1000 }}
              locale={{
                emptyText: (
                  <Empty
                    description="Tidak ada transaksi ditemukan"
                    style={{ padding: "40px 0" }}
                  />
                ),
              }}
            />
          </Spin>
        </Card>
      </div>

      {/* Detail Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShoppingCartOutlined
              style={{ color: "#667eea", fontSize: "20px" }}
            />
            <span>Detail Transaksi</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
        centered
      >
        {selectedTransaction && (
          <div id="receipt-detail">
            <Card
              style={{
                background: "linear-gradient(135deg, #f8f9ff 0%, #e0e7ff 100%)",
                border: "2px solid #667eea",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
              bodyStyle={{ padding: "16px" }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      ID Transaksi
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "#667eea",
                      }}
                    >
                      #TRX{selectedTransaction.id.toString().padStart(6, "0")}
                    </div>
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Kasir</div>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>
                      {selectedTransaction.user_name}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Tanggal & Waktu
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>
                      {dayjs(selectedTransaction.created_at).format(
                        "DD MMM YYYY, HH:mm"
                      )}
                    </div>
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Metode Pembayaran
                    </div>
                    <Tag color="blue" style={{ marginTop: "4px" }}>
                      {selectedTransaction.payment_method_name}
                    </Tag>
                  </div>
                </Col>
              </Row>
            </Card>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ marginBottom: "12px", fontWeight: "600" }}>
                Item Pesanan
              </h4>
              <div
                style={{
                  border: "1px solid #e0e7ff",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9ff" }}>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        Produk
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        Qty
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        Harga
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransaction.items.map((item, index) => (
                      <tr
                        key={item.id}
                        style={{
                          borderTop: index > 0 ? "1px solid #f0f0f0" : "none",
                        }}
                      >
                        <td style={{ padding: "12px", fontSize: "13px" }}>
                          {item.product_name}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            fontSize: "13px",
                          }}
                        >
                          {item.qty}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            fontSize: "13px",
                          }}
                        >
                          Rp {Number(item.price).toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          Rp {Number(item.subtotal).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Divider />

            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "14px", color: "#666" }}>Total</span>
                <span style={{ fontSize: "16px", fontWeight: "600" }}>
                  Rp {Number(selectedTransaction.total_amount).toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "14px", color: "#666" }}>Dibayar</span>
                <span style={{ fontSize: "16px", fontWeight: "600" }}>
                  Rp {Number(selectedTransaction.paid_amount).toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px",
                  background: "#f8f9ff",
                  borderRadius: "8px",
                  marginTop: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#667eea",
                  }}
                >
                  Kembalian
                </span>
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#667eea",
                  }}
                >
                  Rp{" "}
                  {Number(selectedTransaction.change_amount).toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <Button
                size="large"
                block
                onClick={() => setDetailModalVisible(false)}
                style={{
                  height: "48px",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "600",
                }}
              >
                Tutup
              </Button>
              <Button
                type="primary"
                size="large"
                block
                onClick={handlePrintReceipt}
                icon={<PrinterOutlined />}
                style={{
                  height: "48px",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "bold",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                }}
              >
                Cetak Struk
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-detail,
          #receipt-detail * {
            visibility: visible;
          }
          #receipt-detail {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
