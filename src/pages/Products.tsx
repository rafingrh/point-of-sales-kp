import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Popconfirm,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  category_id: number;
  price: number;
  stock: number;
  description?: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*");
    setLoading(false);
    if (error) return message.error("Gagal mengambil data produk");
    setProducts(data as Product[]);
  };

  // Fetch categories
  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) return message.error("Gagal mengambil kategori");
    setCategories(data as Category[]);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      form.setFieldsValue(product);
    } else {
      setEditingProduct(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(values)
          .eq("id", editingProduct.id);
        if (error) throw error;
        message.success("Produk berhasil diupdate");
      } else {
        const { error } = await supabase.from("products").insert([values]);
        if (error) throw error;
        message.success("Produk berhasil ditambahkan");
      }

      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      message.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    const { error } = await supabase.from("products").delete().eq("id", id);
    setLoading(false);

    if (error) return message.error("Gagal menghapus produk");
    message.success("Produk berhasil dihapus");
    fetchProducts();
  };

  const columns: ColumnsType<Product> = [
    {
      title: "No",
      key: "no",
      render: (_value: unknown, _record: Product, index: number): ReactNode =>
        index + 1,
    },
    { title: "Nama Produk", dataIndex: "name", key: "name" },
    {
      title: "Kategori",
      dataIndex: "category_id",
      key: "category_id",
      render: (id: number): ReactNode =>
        categories.find((c) => c.id === id)?.name || "-",
    },
    {
      title: "Harga",
      dataIndex: "price",
      key: "price",
      render: (val: number): ReactNode => `Rp${val.toLocaleString()}`,
    },
    { title: "Stok", dataIndex: "stock", key: "stock" },
    { title: "Deskripsi", dataIndex: "description", key: "description" },
    {
      title: "Actions",
      key: "actions",
      render: (_value: unknown, record: Product): ReactNode => (
        <div className="flex gap-2">
          <Button size="small" type="primary" onClick={() => openModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Yakin ingin menghapus produk?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" className="mb-4" onClick={() => openModal()}>
        Tambah Produk
      </Button>
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingProduct ? "Edit Produk" : "Tambah Produk"}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Nama Produk"
            name="name"
            rules={[{ required: true, message: "Nama produk wajib diisi" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Kategori"
            name="category_id"
            rules={[{ required: true, message: "Kategori wajib dipilih" }]}
          >
            <Select placeholder="Pilih kategori">
              {categories.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Harga"
            name="price"
            rules={[{ required: true, message: "Harga wajib diisi" }]}
          >
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item
            label="Stok"
            name="stock"
            rules={[{ required: true, message: "Stok wajib diisi" }]}
          >
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item label="Deskripsi" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
