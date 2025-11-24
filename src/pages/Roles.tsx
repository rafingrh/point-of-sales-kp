import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, message, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";

interface Role {
  id: number;
  name: string;
}

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();

  // Fetch roles
  const fetchRoles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("roles").select("*");
    setLoading(false);
    if (error) return message.error("Gagal mengambil data role");
    setRoles(data as Role[]);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Open modal
  const openModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      form.setFieldsValue({ name: role.name });
    } else {
      setEditingRole(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  // Handle submit
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingRole) {
        const { error } = await supabase
          .from("roles")
          .update({ name: values.name })
          .eq("id", editingRole.id);
        if (error) throw error;
        message.success("Role berhasil diupdate");
      } else {
        const { error } = await supabase
          .from("roles")
          .insert([{ name: values.name }]);
        if (error) throw error;
        message.success("Role berhasil ditambahkan");
      }

      setModalOpen(false);
      fetchRoles();
    } catch (err) {
      console.error(err);
      message.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    const { error } = await supabase.from("roles").delete().eq("id", id);
    setLoading(false);
    if (error) return message.error("Gagal menghapus role");
    message.success("Role berhasil dihapus");
    fetchRoles();
  };

  const columns: ColumnsType<Role> = [
    {
      title: "No",
      key: "no",
      render: (_value: unknown, _record: Role, index: number): ReactNode =>
        index + 1,
    },
    { title: "Nama Role", dataIndex: "name", key: "name" },
    {
      title: "Actions",
      key: "actions",
      render: (_value: unknown, record: Role): ReactNode => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          />
          <Popconfirm
            title="Yakin ingin menghapus role?"
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
        Tambah Role
      </Button>

      <Table
        columns={columns}
        dataSource={roles}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingRole ? "Edit Role" : "Tambah Role"}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Nama Role"
            name="name"
            rules={[{ required: true, message: "Nama role wajib diisi" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
