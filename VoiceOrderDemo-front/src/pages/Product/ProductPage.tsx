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
  InputNumber,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import axios, { AxiosError } from "axios";
import { PRODUCT_API } from "../../config/api";
import { useMediaQuery } from "react-responsive";
import "./ProductPage.css";

const { Text } = Typography;

interface Product {
  id: number;
  name: string;
  price: number;
  createdAt: string;
}

type ResponsiveBreakpoint = "xxl" | "xl" | "lg" | "md" | "sm" | "xs";

const ProductPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const isMobile = useMediaQuery({ maxWidth: 767 });

  const fetchProducts = async (page = 1, size = 10) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${PRODUCT_API.BASE}?page=${page - 1}&size=${size}`
      );
      setProducts(response.data.content);
      setPagination({
        ...pagination,
        current: page,
        total: response.data.totalElements,
      });
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message || "获取产品列表失败");
      } else {
        message.error("获取产品列表失败");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current && pagination.pageSize) {
      fetchProducts(pagination.current, pagination.pageSize);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Product) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(PRODUCT_API.BY_ID(id));
      message.success("删除成功");
      fetchProducts(pagination.current, pagination.pageSize);
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
      if (editingProduct) {
        await axios.put(PRODUCT_API.BY_ID(editingProduct.id), values);
        message.success("更新成功");
      } else {
        await axios.post(PRODUCT_API.BASE, values);
        message.success("添加成功");
      }
      setModalVisible(false);
      fetchProducts(pagination.current, pagination.pageSize);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message || "操作失败");
      } else {
        message.error("操作失败");
      }
    }
  };

  const formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`;
  };

  const columns = [
    {
      title: "产品名称",
      dataIndex: "name",
      key: "name",
      width: isMobile ? 120 : undefined,
    },
    {
      title: "价格",
      dataIndex: "price",
      key: "price",
      width: isMobile ? 100 : undefined,
      render: (price: number) => formatPrice(price),
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
      render: (_: unknown, record: Product) => (
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
      dataSource={products}
      loading={loading}
      pagination={{
        ...pagination,
        size: "small",
        onChange: (page) => fetchProducts(page, pagination.pageSize),
      }}
      renderItem={(product) => (
        <Card
          className="product-card"
          size="small"
          actions={[
            <Button
              key="edit"
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(product)}
            />,
            <Popconfirm
              key="delete"
              title="确定要删除吗？"
              onConfirm={() => handleDelete(product.id)}
            >
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>,
          ]}
        >
          <div className="product-info">
            <Text strong>{product.name}</Text>
            <Text type="success">{formatPrice(product.price)}</Text>
            <Text type="secondary" className="create-time">
              {new Date(product.createdAt).toLocaleString()}
            </Text>
          </div>
        </Card>
      )}
    />
  );

  return (
    <div className="product-page">
      <div className="page-header">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加产品
        </Button>
      </div>

      {isMobile ? (
        renderMobileList()
      ) : (
        <Table
          columns={columns}
          dataSource={products}
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
        title={editingProduct ? "编辑产品" : "添加产品"}
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
            label="产品名称"
            rules={[{ required: true, message: "请输入产品名称" }]}
          >
            <Input placeholder="请输入产品名称" />
          </Form.Item>
          <Form.Item
            name="price"
            label="价格"
            rules={[{ required: true, message: "请输入价格" }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: "100%" }}
              placeholder="请输入价格"
              prefix="¥"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductPage;
