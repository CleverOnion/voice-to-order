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
import { DRIVER_API } from "../../config/api";
import { useMediaQuery } from "react-responsive";
import "./DriverPage.css";

const { Text } = Typography;

interface Driver {
  id: number;
  name: string;
  phone: string;
  licensePlate: string;
  createdAt: string;
}

type ResponsiveBreakpoint = "xxl" | "xl" | "lg" | "md" | "sm" | "xs";

const DriverPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const isMobile = useMediaQuery({ maxWidth: 767 });

  const fetchDrivers = async (page = 1, size = 10) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${DRIVER_API.BASE}?page=${page - 1}&size=${size}`
      );
      setDrivers(response.data.content);
      setPagination({
        ...pagination,
        current: page,
        total: response.data.totalElements,
      });
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message || "获取司机列表失败");
      } else {
        message.error("获取司机列表失败");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current && pagination.pageSize) {
      fetchDrivers(pagination.current, pagination.pageSize);
    }
  };

  const handleAdd = () => {
    setEditingDriver(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Driver) => {
    setEditingDriver(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(DRIVER_API.BY_ID(id));
      message.success("删除成功");
      fetchDrivers(pagination.current, pagination.pageSize);
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
      if (editingDriver) {
        await axios.put(DRIVER_API.BY_ID(editingDriver.id), values);
        message.success("更新成功");
      } else {
        await axios.post(DRIVER_API.BASE, values);
        message.success("添加成功");
      }
      setModalVisible(false);
      fetchDrivers(pagination.current, pagination.pageSize);
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
      title: "司机姓名",
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
      title: "车牌号",
      dataIndex: "licensePlate",
      key: "licensePlate",
      width: isMobile ? 120 : undefined,
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
      render: (_: unknown, record: Driver) => (
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
      dataSource={drivers}
      loading={loading}
      pagination={{
        ...pagination,
        size: "small",
        onChange: (page) => fetchDrivers(page, pagination.pageSize),
      }}
      renderItem={(driver) => (
        <Card
          className="driver-card"
          size="small"
          actions={[
            <Button
              key="edit"
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(driver)}
            />,
            <Popconfirm
              key="delete"
              title="确定要删除吗？"
              onConfirm={() => handleDelete(driver.id)}
            >
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>,
          ]}
        >
          <div className="driver-info">
            <Text strong>{driver.name}</Text>
            <Text type="secondary">{driver.phone}</Text>
            <Text type="secondary">{driver.licensePlate}</Text>
            <Text type="secondary" className="create-time">
              {new Date(driver.createdAt).toLocaleString()}
            </Text>
          </div>
        </Card>
      )}
    />
  );

  return (
    <div className="driver-page">
      <div className="page-header">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加司机
        </Button>
      </div>

      {isMobile ? (
        renderMobileList()
      ) : (
        <Table
          columns={columns}
          dataSource={drivers}
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
        title={editingDriver ? "编辑司机" : "添加司机"}
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
            label="司机姓名"
            rules={[{ required: true, message: "请输入司机姓名" }]}
          >
            <Input placeholder="请输入司机姓名" />
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
          <Form.Item
            name="licensePlate"
            label="车牌号"
            rules={[
              { required: true, message: "请输入车牌号" },
              {
                pattern:
                  /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5}$/,
                message: "请输入正确的车牌号格式",
              },
            ]}
          >
            <Input placeholder="请输入车牌号（如：京A12345）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DriverPage;
