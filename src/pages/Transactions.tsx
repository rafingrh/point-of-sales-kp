import { useEffect, useState } from "react";
import {
  Button,
  InputNumber,
  Select,
  message,
  Card,
  Row,
  Col,
  Tag,
  Divider,
  Empty,
  Spin,
  Badge,
  Input,
  Modal,
  Radio,
  Space,
} from "antd";
import { supabase } from "../lib/supabase";
import {
  ShoppingCartOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  SearchOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  PrinterOutlined,
} from "@ant-design/icons";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description?: string;
  category_id?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface Category {
  id: number;
  name: string;
}

export default function RestaurantPOS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<number | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<
    { id: number; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{
    items: CartItem[];
    total: number;
    paymentMethod: string;
    date: string;
    transactionId: string;
  } | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Get user ID - Try from Supabase Auth first, then localStorage
      let currentUserId: number | null = null;

      // Method 1: Try Supabase Auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("email", user.email)
          .single();

        if (userData) {
          currentUserId = userData.id;
        }
      }

      // Method 2: Fallback to localStorage
      if (!currentUserId) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            currentUserId = parsedUser.id || parsedUser.user_id;
          } catch (e) {
            console.error("Error parsing user from localStorage:", e);
          }
        }
      }

      setUserId(currentUserId);

      if (!currentUserId) {
        message.warning("User tidak terautentikasi. Silakan login kembali.");
      }

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*");
      if (productsError) message.error("Gagal mengambil produk");
      else setProducts(productsData as Product[]);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*");
      if (categoriesError) message.error("Gagal mengambil kategori");
      else setCategories(categoriesData as Category[]);

      // Fetch payment methods
      const { data: paymentData, error: paymentError } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_active", true);
      if (paymentError) message.error("Gagal mengambil metode pembayaran");
      else setPaymentMethods(paymentData as { id: number; name: string }[]);

      setLoading(false);
    };

    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        if (exists.quantity < product.stock) {
          return prev.map((p) =>
            p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
          );
        } else {
          message.warning("Stok tidak cukup");
          return prev;
        }
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
    } else {
      setCart((prev) =>
        prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p))
      );
    }
  };

  const removeFromCart = (id: number) =>
    setCart((prev) => prev.filter((p) => p.id !== id));

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleSelectPayment = () => {
    if (cart.length === 0) return message.warning("Keranjang masih kosong");
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelect = (methodId: number) => {
    setPaymentMethod(methodId);
    setShowPaymentModal(false);
    setShowSummaryModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!userId) {
      message.error("User tidak terautentikasi");
      return;
    }

    if (!paymentMethod) {
      message.error("Metode pembayaran tidak valid");
      return;
    }

    setProcessingPayment(true);

    try {
      // 1. Insert transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          payment_method_id: paymentMethod,
          total_amount: totalAmount,
          paid_amount: totalAmount, // Untuk saat ini assume paid sama dengan total
          change_amount: 0, // Bisa diupdate nanti jika ada fitur kembalian
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // 2. Insert transaction items
      const transactionItems = cart.map((item) => ({
        transaction_id: transactionData.id,
        product_id: item.id,
        qty: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("transaction_items")
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      // 3. Update stock products dan create stock logs
      for (const item of cart) {
        // Update stock
        const { error: stockError } = await supabase
          .from("products")
          .update({ stock: item.stock - item.quantity })
          .eq("id", item.id);

        if (stockError) throw stockError;

        // Create stock log
        const { error: logError } = await supabase.from("stock_logs").insert({
          product_id: item.id,
          qty_change: -item.quantity,
          reason: `Penjualan - Transaction #${transactionData.id}`,
        });

        if (logError) throw logError;
      }

      // 4. Refresh products data
      const { data: updatedProducts } = await supabase
        .from("products")
        .select("*");
      if (updatedProducts) setProducts(updatedProducts as Product[]);

      // Generate transaction details for receipt
      const transactionDate = new Date(
        transactionData.created_at
      ).toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Save transaction data for receipt
      setLastTransaction({
        items: [...cart],
        total: totalAmount,
        paymentMethod: selectedPaymentMethodName || "",
        date: transactionDate,
        transactionId: `TRX${transactionData.id.toString().padStart(8, "0")}`,
      });

      message.success("Transaksi berhasil diproses!");
      setShowSummaryModal(false);
      setShowReceiptModal(true);
    } catch (error) {
      console.error("Error processing transaction:", error);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
    setCart([]);
    setPaymentMethod(null);
    setLastTransaction(null);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleCancelSummary = () => {
    setShowSummaryModal(false);
    setPaymentMethod(null);
  };

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === null || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedPaymentMethodName = paymentMethods.find(
    (m) => m.id === paymentMethod
  )?.name;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(to bottom right, #f5f7fa, #e9ecf1)",
        padding: "24px 16px",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <Row gutter={24}>
          {/* Products Grid */}
          <Col xs={24} lg={16}>
            {/* Search and Filter */}
            <div style={{ marginBottom: "20px" }}>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={14}>
                  <Input
                    size="large"
                    placeholder="Cari produk..."
                    prefix={<SearchOutlined style={{ color: "#667eea" }} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ borderRadius: "8px" }}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={10}>
                  <Select
                    size="large"
                    placeholder="Semua Kategori"
                    value={selectedCategory}
                    onChange={(val) => setSelectedCategory(val)}
                    style={{ width: "100%", borderRadius: "8px" }}
                    allowClear
                  >
                    {categories.map((cat) => (
                      <Select.Option key={cat.id} value={cat.id}>
                        {cat.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </div>

            <Spin spinning={loading}>
              <Row gutter={[12, 12]}>
                {filteredProducts.length === 0 && !loading ? (
                  <Col span={24}>
                    <Empty description="Tidak ada produk ditemukan" />
                  </Col>
                ) : (
                  filteredProducts.map((p) => (
                    <Col xs={12} sm={8} md={6} key={p.id}>
                      <Card
                        hoverable
                        className="h-full"
                        style={{
                          borderRadius: "8px",
                          overflow: "hidden",
                          background: "#fff",
                          border: p.stock === 0 ? "2px solid #f5f5f5" : "none",
                          transition: "all 0.3s ease",
                        }}
                        cover={
                          <div
                            style={{
                              height: "100px",
                              background:
                                p.stock === 0
                                  ? "linear-gradient(135deg, #cccccc, #999999)"
                                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "48px",
                              position: "relative",
                            }}
                          >
                            🛍️
                            {p.stock === 0 && (
                              <div
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  background: "rgba(0,0,0,0.6)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#fff",
                                  fontWeight: "bold",
                                  fontSize: "12px",
                                }}
                              >
                                Habis
                              </div>
                            )}
                          </div>
                        }
                        bodyStyle={{ padding: "12px" }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            marginBottom: "6px",
                            minHeight: "32px",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {p.name}
                        </div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#667eea",
                            marginBottom: "6px",
                          }}
                        >
                          Rp {p.price.toLocaleString()}
                        </div>
                        <Tag
                          color={p.stock === 0 ? "red" : "green"}
                          style={{ marginBottom: "8px", fontSize: "11px" }}
                        >
                          {p.stock === 0 ? "Habis" : `Stok: ${p.stock}`}
                        </Tag>
                        <Button
                          type="primary"
                          block
                          disabled={p.stock === 0}
                          onClick={() => addToCart(p)}
                          size="small"
                          style={{
                            height: "32px",
                            borderRadius: "6px",
                            background:
                              p.stock === 0
                                ? undefined
                                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            borderColor: p.stock === 0 ? undefined : "#667eea",
                            fontWeight: "600",
                            fontSize: "12px",
                          }}
                          icon={<PlusOutlined />}
                        >
                          Tambah
                        </Button>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Spin>
          </Col>

          {/* Cart Sidebar */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Badge
                    count={cart.length}
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  >
                    <ShoppingCartOutlined
                      style={{ fontSize: "20px", color: "#667eea" }}
                    />
                  </Badge>
                  <span style={{ fontWeight: "600" }}>Keranjang</span>
                </div>
              }
              style={{
                borderRadius: "12px",
                height: "fit-content",
                position: "sticky",
                top: "24px",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.15)",
              }}
              bodyStyle={{
                padding: "16px",
                maxHeight: "calc(100vh - 100px)",
                overflowY: "auto",
              }}
            >
              {cart.length === 0 ? (
                <Empty
                  description="Keranjang kosong"
                  style={{ marginTop: "32px" }}
                />
              ) : (
                <>
                  <div style={{ marginBottom: "16px" }}>
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          marginBottom: "12px",
                          padding: "12px",
                          background: "#f8f9ff",
                          borderRadius: "8px",
                          border: "1px solid #e0e7ff",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: "600",
                                color: "#000",
                                fontSize: "13px",
                              }}
                            >
                              {item.name}
                            </div>
                            <div
                              style={{
                                color: "#667eea",
                                fontWeight: "bold",
                                fontSize: "14px",
                                marginTop: "4px",
                              }}
                            >
                              Rp {item.price.toLocaleString()}
                            </div>
                          </div>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeFromCart(item.id)}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Button
                            size="small"
                            icon={<MinusOutlined />}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            style={{ borderRadius: "4px" }}
                          />
                          <InputNumber
                            min={1}
                            max={item.stock}
                            value={item.quantity}
                            onChange={(v) => updateQuantity(item.id, v || 1)}
                            style={{ width: "50px" }}
                            size="small"
                          />
                          <Button
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.stock}
                            style={{ borderRadius: "4px" }}
                          />
                        </div>
                        <div
                          style={{
                            marginTop: "8px",
                            textAlign: "right",
                            fontWeight: "600",
                            color: "#667eea",
                            fontSize: "13px",
                          }}
                        >
                          Subtotal: Rp{" "}
                          {(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #f8f9ff 0%, #e0e7ff 100%)",
                      padding: "16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      border: "2px solid #667eea",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        fontSize: "13px",
                        color: "#666",
                      }}
                    >
                      <span>Total Item</span>
                      <span style={{ fontWeight: "600" }}>{cart.length}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        fontSize: "13px",
                        color: "#666",
                      }}
                    >
                      <span>Total Qty</span>
                      <span style={{ fontWeight: "600" }}>
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </div>
                    <Divider style={{ margin: "8px 0" }} />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#667eea",
                      }}
                    >
                      <span>Total</span>
                      <span>Rp {totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button
                    type="primary"
                    block
                    size="large"
                    disabled={cart.length === 0}
                    onClick={handleSelectPayment}
                    style={{
                      height: "48px",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      borderColor: "#667eea",
                    }}
                    icon={<CreditCardOutlined />}
                  >
                    Pilih Metode Pembayaran
                  </Button>

                  <Button
                    block
                    size="large"
                    danger
                    style={{
                      marginTop: "8px",
                      height: "40px",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    onClick={() => setCart([])}
                    icon={<DeleteOutlined />}
                  >
                    Kosongkan Keranjang
                  </Button>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Payment Method Selection Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CreditCardOutlined
              style={{ color: "#667eea", fontSize: "20px" }}
            />
            <span>Pilih Metode Pembayaran</span>
          </div>
        }
        open={showPaymentModal}
        onCancel={() => setShowPaymentModal(false)}
        footer={null}
        width={500}
        centered
      >
        <div style={{ marginTop: "24px" }}>
          <Radio.Group
            style={{ width: "100%" }}
            value={null}
            onChange={(e) => handlePaymentMethodSelect(e.target.value)}
          >
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  hoverable
                  style={{
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: "2px solid #e0e7ff",
                    transition: "all 0.3s ease",
                  }}
                  bodyStyle={{ padding: "16px" }}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                >
                  <Radio value={method.id} style={{ width: "100%" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#000",
                          }}
                        >
                          {method.name}
                        </div>
                      </div>
                      <CreditCardOutlined
                        style={{ fontSize: "24px", color: "#667eea" }}
                      />
                    </div>
                  </Radio>
                </Card>
              ))}
            </Space>
          </Radio.Group>
        </div>
      </Modal>

      {/* Order Summary Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShoppingCartOutlined
              style={{ color: "#667eea", fontSize: "20px" }}
            />
            <span>Ringkasan Pesanan</span>
          </div>
        }
        open={showSummaryModal}
        onCancel={handleCancelSummary}
        footer={null}
        width={600}
        centered
      >
        <div style={{ marginTop: "24px" }}>
          {/* Payment Method Info */}
          <Card
            style={{
              background: "linear-gradient(135deg, #f8f9ff 0%, #e0e7ff 100%)",
              border: "2px solid #667eea",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
            bodyStyle={{ padding: "16px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "4px",
                  }}
                >
                  Metode Pembayaran
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#667eea",
                  }}
                >
                  {selectedPaymentMethodName}
                </div>
              </div>
              <CreditCardOutlined
                style={{ fontSize: "32px", color: "#667eea" }}
              />
            </div>
          </Card>

          {/* Order Items */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#000",
              }}
            >
              Detail Pesanan
            </div>
            {cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                  padding: "12px",
                  background: "#f8f9ff",
                  borderRadius: "6px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "4px",
                    }}
                  >
                    Rp {item.price.toLocaleString()} x {item.quantity}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: "bold",
                    color: "#667eea",
                    fontSize: "14px",
                  }}
                >
                  Rp {(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <Card
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
            bodyStyle={{ padding: "16px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "12px", color: "#fff", opacity: 0.9 }}>
                  Total Pembayaran
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#fff",
                  }}
                >
                  Rp {totalAmount.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: "right", color: "#fff" }}>
                <div style={{ fontSize: "12px", opacity: 0.9 }}>
                  {cart.length} Item
                </div>
                <div style={{ fontSize: "12px", opacity: 0.9 }}>
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} Qty
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <Button
              size="large"
              block
              onClick={handleCancelSummary}
              disabled={processingPayment}
              style={{
                height: "48px",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "600",
              }}
              icon={<CloseOutlined />}
            >
              Batal
            </Button>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleConfirmPayment}
              loading={processingPayment}
              disabled={processingPayment}
              style={{
                height: "48px",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderColor: "#667eea",
              }}
              icon={!processingPayment && <CheckCircleOutlined />}
            >
              {processingPayment ? "Memproses..." : "Konfirmasi Pembayaran"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        title={null}
        open={showReceiptModal}
        onCancel={handleCloseReceipt}
        footer={null}
        width={400}
        centered
        closeIcon={null}
      >
        <div id="receipt-content">
          {/* Receipt Header */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "8px",
              }}
            >
              RESTAURANT POS
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              Jl. Contoh No. 123, Jakarta
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              Telp: (021) 1234-5678
            </div>
            <Divider style={{ margin: "16px 0" }} />
          </div>

          {/* Transaction Info */}
          {lastTransaction && (
            <>
              <div style={{ marginBottom: "16px", fontSize: "12px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ color: "#666" }}>No. Transaksi:</span>
                  <span style={{ fontWeight: "600" }}>
                    {lastTransaction.transactionId}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ color: "#666" }}>Tanggal:</span>
                  <span style={{ fontWeight: "600" }}>
                    {lastTransaction.date}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "#666" }}>Pembayaran:</span>
                  <span style={{ fontWeight: "600" }}>
                    {lastTransaction.paymentMethod}
                  </span>
                </div>
              </div>

              <Divider style={{ margin: "16px 0" }} />

              {/* Items */}
              <div style={{ marginBottom: "16px" }}>
                {lastTransaction.items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "12px",
                      fontSize: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "600",
                        marginBottom: "4px",
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#666",
                        paddingLeft: "8px",
                      }}
                    >
                      <span>
                        {item.quantity} x Rp {item.price.toLocaleString()}
                      </span>
                      <span style={{ fontWeight: "600", color: "#000" }}>
                        Rp {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Divider style={{ margin: "16px 0", borderColor: "#000" }} />

              {/* Total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginBottom: "24px",
                }}
              >
                <span>TOTAL</span>
                <span>Rp {lastTransaction.total.toLocaleString()}</span>
              </div>

              <Divider style={{ margin: "16px 0" }} />

              {/* Footer */}
              <div
                style={{ textAlign: "center", fontSize: "12px", color: "#666" }}
              >
                <div style={{ marginBottom: "8px" }}>
                  Terima kasih atas kunjungan Anda!
                </div>
                <div>Selamat menikmati pesanan Anda</div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
          <Button
            size="large"
            block
            onClick={handleCloseReceipt}
            style={{
              height: "48px",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "600",
            }}
            icon={<CheckCircleOutlined />}
          >
            Selesai
          </Button>
          <Button
            type="primary"
            size="large"
            block
            onClick={handlePrintReceipt}
            style={{
              height: "48px",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderColor: "#667eea",
            }}
            icon={<PrinterOutlined />}
          >
            Cetak Struk
          </Button>
        </div>
      </Modal>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content,
          #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
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
