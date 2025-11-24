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
} from "antd";
import { supabase } from "../lib/supabase";
import {
  ShoppingCartOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  SearchOutlined,
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

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

  const handleCheckout = () => {
    if (!paymentMethod) return message.warning("Pilih metode pembayaran");
    if (cart.length === 0) return message.warning("Pesanan kosong");
    message.success("Pesanan berhasil dibuat!");
    setCart([]);
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

                  <Select
                    placeholder="Pilih metode pembayaran"
                    value={paymentMethod || undefined}
                    onChange={(val) => setPaymentMethod(val)}
                    style={{ width: "100%", marginBottom: "12px" }}
                    size="large"
                  >
                    {paymentMethods.map((m) => (
                      <Select.Option key={m.id} value={m.id}>
                        {m.name}
                      </Select.Option>
                    ))}
                  </Select>

                  <Button
                    type="primary"
                    block
                    size="large"
                    disabled={cart.length === 0 || !paymentMethod}
                    onClick={handleCheckout}
                    style={{
                      height: "48px",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: "bold",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      borderColor: "#667eea",
                    }}
                    icon={<ShoppingCartOutlined />}
                  >
                    Proses Transaksi
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
    </div>
  );
}
