import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
}

interface Role {
  id: number;
  name: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // fetch user list
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("users").select("*");
    setLoading(false);
    if (error) return message.error("Gagal mengambil data user");
    setUsers(data as User[]);
  };

  // fetch roles
  const fetchRoles = async () => {
    const { data, error } = await supabase.from("roles").select("*");
    if (error) return message.error("Gagal mengambil data role");
    setRoles(data as Role[]);
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // open modal
  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        role_id: user.role_id,
        password: "",
      });
    } else {
      setEditingUser(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  // handle form submit
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingUser) {
        const { error } = await supabase.rpc("update_user", {
          p_id: editingUser.id,
          p_name: values.name,
          p_email: values.email,
          p_role_id: values.role_id,
          p_password: values.password || "",
        });

        if (error) throw error;
        message.success("User berhasil diupdate");
      } else {
        const { error } = await supabase.rpc("register_user", {
          p_name: values.name,
          p_email: values.email,
          p_role_id: values.role_id,
          p_password: values.password,
        });

        if (error) throw error;
        message.success("User berhasil ditambahkan");
      }

      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      message.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    const { error } = await supabase.from("users").delete().eq("id", id);
    setLoading(false);

    if (error) return message.error("Gagal menghapus user");
    message.success("User berhasil dihapus");
    fetchUsers();
  };

  const columns: ColumnsType<User> = [
    {
      title: "No",
      key: "no",
      render: (_value: unknown, _record: User, index: number): ReactNode =>
        index + 1,
    },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Role",
      dataIndex: "role_id",
      key: "role_id",
      render: (role_id: number): ReactNode =>
        roles.find((r) => r.id === role_id)?.name || "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_value: unknown, record: User): ReactNode => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          />
          <Popconfirm
            title="Yakin ingin menghapus user?"
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
        Tambah User
      </Button>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingUser ? "Edit User" : "Tambah User"}
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
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email wajib diisi" },
              { type: "email", message: "Format email salah" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={
              editingUser
                ? []
                : [{ required: true, message: "Password wajib diisi" }]
            }
          >
            <Input.Password
              placeholder={
                editingUser ? "Kosongkan jika tidak ingin mengganti" : ""
              }
            />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role_id"
            rules={[{ required: true, message: "Role wajib dipilih" }]}
          >
            <Select placeholder="Pilih role">
              {roles.map((r) => (
                <Select.Option key={r.id} value={r.id}>
                  {r.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
