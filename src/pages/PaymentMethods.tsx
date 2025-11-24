import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tag,
  Select,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";

interface PaymentMethod {
  id: number;
  name: string;
  is_active: boolean;
}

export default function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
    null
  );
  const [form] = Form.useForm();

  // Fetch list payment methods
  const fetchMethods = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("payment_methods").select("*");
    setLoading(false);
    if (error) return message.error("Gagal mengambil data payment methods");
    setMethods(data as PaymentMethod[]);
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  // Open modal for add/edit
  const openModal = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      form.setFieldsValue(method);
    } else {
      setEditingMethod(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingMethod) {
        const { error } = await supabase
          .from("payment_methods")
          .update(values)
          .eq("id", editingMethod.id);
        if (error) throw error;
        message.success("Payment method berhasil diupdate");
      } else {
        const { error } = await supabase
          .from("payment_methods")
          .insert([values]);
        if (error) throw error;
        message.success("Payment method berhasil ditambahkan");
      }

      setModalOpen(false);
      fetchMethods();
    } catch (err) {
      console.error(err);
      message.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", id);
    setLoading(false);

    if (error) return message.error("Gagal menghapus payment method");
    message.success("Payment method berhasil dihapus");
    fetchMethods();
  };

  const columns: ColumnsType<PaymentMethod> = [
    {
      title: "No",
      key: "no",
      render: (
        _value: unknown,
        _record: PaymentMethod,
        index: number
      ): ReactNode => index + 1,
    },
    { title: "Nama", dataIndex: "name", key: "name" },
    {
      title: "Aktif",
      dataIndex: "is_active",
      key: "is_active",
      render: (is_active: boolean): ReactNode =>
        is_active ? (
          <Tag color="green">Aktif</Tag>
        ) : (
          <Tag color="red">Tidak Aktif</Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_value: unknown, record: PaymentMethod): ReactNode => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          />
          <Popconfirm
            title="Yakin ingin menghapus payment method?"
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
        Tambah Payment Method
      </Button>

      <Table
        columns={columns}
        dataSource={methods}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingMethod ? "Edit Payment Method" : "Tambah Payment Method"}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Nama"
            name="name"
            rules={[{ required: true, message: "Nama wajib diisi" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Aktif"
            name="is_active"
            rules={[
              { required: true, message: "Harus dipilih aktif atau tidak" },
            ]}
            initialValue={true}
          >
            <Select>
              <Select.Option value={true}>Ya</Select.Option>
              <Select.Option value={false}>Tidak</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
