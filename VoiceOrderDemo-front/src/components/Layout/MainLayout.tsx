import React, { useState } from "react";
import { Layout, Menu, Button } from "antd";
import {
  HomeOutlined,
  BookOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CarOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Content } = Layout;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuVisible, setMenuVisible] = useState(false);

  const menuItems = [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: "首页",
    },
    {
      key: "/jargons",
      icon: <BookOutlined />,
      label: "行话管理",
    },
    {
      key: "/products",
      icon: <ShoppingCartOutlined />,
      label: "产品管理",
    },
    {
      key: "/customers",
      icon: <UserOutlined />,
      label: "客户管理",
    },
    {
      key: "/drivers",
      icon: <CarOutlined />,
      label: "司机管理",
    },
  ];

  const handleMenuClick = (key: string) => {
    navigate(key);
    setMenuVisible(false);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          padding: "0 16px",
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "18px" }}>语音点单系统</h1>
        </div>

        {/* 桌面端菜单 */}
        <div className="desktop-menu" style={{ flex: 2 }}>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => handleMenuClick(key)}
            style={{ justifyContent: "center", border: "none" }}
          />
        </div>

        {/* 移动端菜单按钮 */}
        <div className="mobile-menu-button">
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMenuVisible(!menuVisible)}
          />
        </div>
      </Header>

      {/* 移动端下拉菜单 */}
      <div
        className={`mobile-dropdown-menu ${menuVisible ? "visible" : ""}`}
        onClick={() => setMenuVisible(false)}
      >
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          style={{
            border: "none",
            fontSize: "14px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        />
      </div>

      <Content
        style={{
          padding: "24px",
          marginTop: "64px",
          background: "#fff",
          minHeight: "calc(100vh - 64px)",
          overflow: "auto",
        }}
      >
        {children}
      </Content>
    </Layout>
  );
};

export default MainLayout;
