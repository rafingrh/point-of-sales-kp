import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, message, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { supabase } from "../lib/supabase";
import type { ColumnsType } from "antd/es/table";
import type { ReactNode } from "react";

interface Category {
  id: number;
  name: string;
  created_at?: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  // fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("id");
    setLoading(false);
    if (error) return message.error("Gagal mengambil data kategori");
    setCategories(data as Category[]);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // open modal for create/edit
  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue({ name: category.name });
    } else {
      setEditingCategory(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  // handle submit
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update({ name: values.name })
          .eq("id", editingCategory.id);
        if (error) throw error;
        message.success("Kategori berhasil diupdate");
      } else {
        const { error } = await supabase
          .from("categories")
          .insert([{ name: values.name }]);
        if (error) throw error;
        message.success("Kategori berhasil ditambahkan");
      }

      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      message.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // handle delete
  const handleDelete = async (id: number) => {
    setLoading(true);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    setLoading(false);
    if (error) return message.error("Gagal menghapus kategori");
    message.success("Kategori berhasil dihapus");
    fetchCategories();
  };

  const columns: ColumnsType<Category> = [
    {
      title: "No",
      key: "no",
      render: (_: Category, __: Category, index: number): ReactNode =>
        index + 1,
    },
    {
      title: "Nama Kategori",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Aksi",
      key: "actions",
      render: (_: Category, record: Category): ReactNode => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          />
          <Popconfirm
            title="Yakin ingin menghapus kategori?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" className="mb-4" onClick={() => openModal()}>
        Tambah Kategori
      </Button>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingCategory ? "Edit Kategori" : "Tambah Kategori"}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Nama Kategori"
            name="name"
            rules={[{ required: true, message: "Nama kategori wajib diisi" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
