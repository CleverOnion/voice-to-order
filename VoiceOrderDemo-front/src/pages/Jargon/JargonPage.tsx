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
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SwapRightOutlined,
} from "@ant-design/icons";
import axios, { AxiosError } from "axios";
import { JARGON_API } from "../../config/api";
import { useMediaQuery } from "react-responsive";
import "./JargonPage.css";

const { Text, Paragraph } = Typography;

interface Jargon {
  id: number;
  jargonName: string;
  originName: string;
}

const JargonPage: React.FC = () => {
  const [jargons, setJargons] = useState<Jargon[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingJargon, setEditingJargon] = useState<Jargon | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const isMobile = useMediaQuery({ maxWidth: 767 });

  const fetchJargons = async (page = 1, size = 10) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${JARGON_API.BASE}?page=${page - 1}&size=${size}`
      );
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.content;
      setJargons(data);
      if (!Array.isArray(response.data)) {
        setPagination({
          ...pagination,
          current: page,
          total: response.data.totalElements,
        });
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        message.error(error.response?.data?.message || "获取行话列表失败");
      } else {
        message.error("获取行话列表失败");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJargons();
  }, []);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current && pagination.pageSize) {
      fetchJargons(pagination.current, pagination.pageSize);
    }
  };

  const handleAdd = () => {
    setEditingJargon(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Jargon) => {
    setEditingJargon(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(JARGON_API.BY_ID(id));
      message.success("删除成功");
      fetchJargons(pagination.current, pagination.pageSize);
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
      if (editingJargon) {
        await axios.put(JARGON_API.BY_ID(editingJargon.id), values);
        message.success("更新成功");
      } else {
        await axios.post(JARGON_API.BASE, values);
        message.success("添加成功");
      }
      setModalVisible(false);
      fetchJargons(pagination.current, pagination.pageSize);
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
      title: "行话",
      dataIndex: "jargonName",
      key: "jargonName",
      width: isMobile ? 120 : undefined,
    },
    {
      title: "原始说法",
      dataIndex: "originName",
      key: "originName",
      width: isMobile ? 200 : undefined,
      render: (text: string) => (
        <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: "更多" }}>
          {text}
        </Paragraph>
      ),
    },
    {
      title: "操作",
      key: "action",
      fixed: "right" as const,
      width: isMobile ? 100 : 120,
      render: (_: unknown, record: Jargon) => (
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
      dataSource={jargons}
      loading={loading}
      pagination={
        Array.isArray(jargons)
          ? false
          : {
              ...pagination,
              size: "small",
              onChange: (page) => fetchJargons(page, pagination.pageSize),
            }
      }
      renderItem={(jargon) => (
        <Card
          className="jargon-card"
          size="small"
          actions={[
            <Button
              key="edit"
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(jargon)}
            />,
            <Popconfirm
              key="delete"
              title="确定要删除吗？"
              onConfirm={() => handleDelete(jargon.id)}
            >
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>,
          ]}
        >
          <div className="jargon-info">
            <div className="jargon-conversion">
              <div className="jargon-item">
                <Text type="secondary">原始说法：</Text>
                <Text>{jargon.originName}</Text>
              </div>
              <SwapRightOutlined className="conversion-arrow" />
              <div className="jargon-item">
                <Text type="secondary">行话：</Text>
                <Text strong>{jargon.jargonName}</Text>
              </div>
            </div>
          </div>
        </Card>
      )}
    />
  );

  return (
    <div className="jargon-page">
      <div className="page-header">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加行话
        </Button>
      </div>

      {isMobile ? (
        renderMobileList()
      ) : (
        <Table
          columns={columns}
          dataSource={jargons}
          rowKey="id"
          pagination={
            Array.isArray(jargons)
              ? false
              : {
                  ...pagination,
                  size: "small",
                }
          }
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
          size="middle"
        />
      )}

      <Modal
        title={editingJargon ? "编辑行话" : "添加行话"}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={isMobile ? "95%" : 520}
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="originName"
            label="原始说法"
            rules={[
              { required: true, message: "请输入原始说法" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("jargonName") !== value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("行话不能与原始说法相同"));
                },
              }),
            ]}
          >
            <Input.TextArea
              placeholder="请输入原始说法"
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>
          <Form.Item
            name="jargonName"
            label="行话"
            rules={[
              { required: true, message: "请输入行话" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("originName") !== value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("行话不能与原始说法相同"));
                },
              }),
            ]}
            dependencies={["originName"]}
          >
            <Input placeholder="请输入行话" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default JargonPage;
