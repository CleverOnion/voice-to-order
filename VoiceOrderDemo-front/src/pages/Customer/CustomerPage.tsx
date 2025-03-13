import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Popconfirm,
  TablePaginationConfig,
  Card,
  List,
  Typography,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import axios, { AxiosError } from "axios";
import { CUSTOMER_API } from "../../config/api";
import { useMediaQuery } from "react-responsive";
import "./CustomerPage.css";

const { Text } = Typography;

interface Customer {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
}

type ResponsiveBreakpoint = "xxl" | "xl" | "lg" | "md" | "sm" | "xs";

const CustomerPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const isMobile = useMediaQuery({ maxWidth: 767 });

  const fetchCustomers = async (page = 1, size = 10) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${CUSTOMER_API.BASE}?page=${page - 1}&size=${size}`
      );
      setCustomers(response.data.content);
      setPagination({
        ...pagination,
        current: page,
        total: response.data.totalElements,
      });
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message || "获取客户列表失败");
      } else {
        message.error("获取客户列表失败");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current && pagination.pageSize) {
      fetchCustomers(pagination.current, pagination.pageSize);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Customer) => {
    setEditingCustomer(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(CUSTOMER_API.BY_ID(id));
      message.success("删除成功");
      fetchCustomers(pagination.current, pagination.pageSize);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message || "删除失败");
      } else {
        message.error("删除失败");
      }
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingCustomer) {
        await axios.put(CUSTOMER_API.BY_ID(editingCustomer.id), values);
        message.success("更新成功");
      } else {
        await axios.post(CUSTOMER_API.BASE, values);
        message.success("添加成功");
      }
      setModalVisible(false);
      fetchCustomers(pagination.current, pagination.pageSize);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message || "操作失败");
      } else {
        message.error("操作失败");
      }
    }
  };

  const columns = [
    {
      title: "客户名称",
      dataIndex: "name",
      key: "name",
      width: isMobile ? 120 : undefined,
    },
    {
      title: "联系电话",
      dataIndex: "phone",
      key: "phone",
      width: isMobile ? 130 : undefined,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: isMobile ? 150 : undefined,
      render: (createdAt: string) => new Date(createdAt).toLocaleString(),
      responsive: ["lg" as ResponsiveBreakpoint],
    },
    {
      title: "操作",
      key: "action",
      fixed: "right" as const,
      width: isMobile ? 100 : 120,
      render: (_: unknown, record: Customer) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {!isMobile && "编辑"}
          </Button>
          <Popconfirm
            title="确定要删除吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              {!isMobile && "删除"}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderMobileList = () => (
    <List
      dataSource={customers}
      loading={loading}
      pagination={{
        ...pagination,
        size: "small",
        onChange: (page) => fetchCustomers(page, pagination.pageSize),
      }}
      renderItem={(customer) => (
        <Card
          className="customer-card"
          size="small"
          actions={[
            <Button
              key="edit"
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(customer)}
            />,
            <Popconfirm
              key="delete"
              title="确定要删除吗？"
              onConfirm={() => handleDelete(customer.id)}
            >
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>,
          ]}
        >
          <div className="customer-info">
            <Text strong>{customer.name}</Text>
            <Text type="secondary">{customer.phone}</Text>
            <Text type="secondary" className="create-time">
              {new Date(customer.createdAt).toLocaleString()}
            </Text>
          </div>
        </Card>
      )}
    />
  );

  return (
    <div className="customer-page">
      <div className="page-header">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加客户
        </Button>
      </div>

      {isMobile ? (
        renderMobileList()
      ) : (
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          pagination={{
            ...pagination,
            size: "small",
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
          size="middle"
        />
      )}

      <Modal
        title={editingCustomer ? "编辑客户" : "添加客户"}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={isMobile ? "95%" : 520}
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="客户名称"
            rules={[{ required: true, message: "请输入客户名称" }]}
          >
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="联系电话"
            rules={[
              { required: true, message: "请输入联系电话" },
              {
                pattern: /^1[3-9]\d{9}$/,
                message: "请输入正确的手机号码",
              },
            ]}
          >
            <Input placeholder="请输入联系电话" type="tel" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerPage;
