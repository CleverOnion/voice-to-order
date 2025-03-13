import React, { useEffect, useState } from "react";
import { Input, InputNumber, Select, message } from "antd";
import { ExclamationCircleFilled } from "@ant-design/icons";
import axios from "axios";
import { CUSTOMER_API, DRIVER_API, PRODUCT_API } from "../config/api";
import "./OrderForm.css";

interface Customer {
  id: number;
  name: string;
  phone: string;
}

interface Driver {
  id: number;
  name: string;
  phone: string;
  licensePlate: string;
}

interface Product {
  id: number;
  name: string;
}

interface OrderData {
  customerInfo: {
    id: number;
    name: string;
    phone: string;
    exists?: boolean;
  } | null;
  productInfo: {
    id?: number;
    name: string;
    quantity?: number;
    exists?: boolean;
  } | null;
  driverInfo: {
    id: number;
    name: string;
    phone: string;
    licensePlate: string;
    exists?: boolean;
  } | null;
}

interface OrderFormProps {
  data: OrderData;
  onDataChange: (newData: OrderData) => void;
  disabled?: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({
  data,
  onDataChange,
  disabled = false,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState({
    customers: false,
    drivers: false,
    products: false,
  });

  useEffect(() => {
    fetchCustomers();
    fetchDrivers();
    fetchProducts();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading((prev) => ({ ...prev, customers: true }));
      const response = await axios.get(CUSTOMER_API.BASE);
      setCustomers(response.data.content);
    } catch (error) {
      message.error("获取客户列表失败");
      console.error("获取客户列表失败:", error);
    } finally {
      setLoading((prev) => ({ ...prev, customers: false }));
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoading((prev) => ({ ...prev, drivers: true }));
      const response = await axios.get(DRIVER_API.BASE);
      setDrivers(response.data.content);
    } catch (error) {
      message.error("获取司机列表失败");
      console.error("获取司机列表失败:", error);
    } finally {
      setLoading((prev) => ({ ...prev, drivers: false }));
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading((prev) => ({ ...prev, products: true }));
      const response = await axios.get(PRODUCT_API.BASE);
      setProducts(response.data.content);
    } catch (error) {
      message.error("获取产品列表失败");
      console.error("获取产品列表失败:", error);
    } finally {
      setLoading((prev) => ({ ...prev, products: false }));
    }
  };

  const handleCustomerChange = (value: number | null) => {
    const customer = customers.find((c) => c.id === value);
    onDataChange({
      ...data,
      customerInfo: customer
        ? {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            exists: true,
          }
        : null,
    });
  };

  const handleProductChange = (value: number | null) => {
    const product = products.find((p) => p.id === value);
    onDataChange({
      ...data,
      productInfo: product
        ? {
            id: product.id,
            name: product.name,
            quantity: data.productInfo?.quantity,
            exists: true,
          }
        : null,
    });
  };

  const handleQuantityChange = (value: number | null) => {
    onDataChange({
      ...data,
      productInfo: data.productInfo
        ? {
            ...data.productInfo,
            quantity: value || undefined,
          }
        : null,
    });
  };

  const handleDriverChange = (value: number | null) => {
    const driver = drivers.find((d) => d.id === value);
    onDataChange({
      ...data,
      driverInfo: driver
        ? {
            id: driver.id,
            name: driver.name,
            phone: driver.phone,
            licensePlate: driver.licensePlate,
            exists: true,
          }
        : null,
    });
  };

  return (
    <div className="order-form">
      <div className="form-section">
        <h3>客户信息</h3>
        <table>
          <tbody>
            <tr>
              <td>客户姓名：</td>
              <td style={{ position: "relative" }}>
                {data.customerInfo?.exists === false && (
                  <div style={{ marginBottom: "8px" }}>
                    <Input
                      value={data.customerInfo.name}
                      disabled={true}
                      status="error"
                      suffix={
                        <ExclamationCircleFilled
                          style={{
                            color: "#ff4d4f",
                          }}
                        />
                      }
                    />
                  </div>
                )}
                <Select
                  value={
                    data.customerInfo?.exists
                      ? data.customerInfo?.id
                      : undefined
                  }
                  onChange={handleCustomerChange}
                  placeholder={
                    data.customerInfo?.exists === false
                      ? "请选择其他客户"
                      : "请选择客户"
                  }
                  disabled={disabled}
                  loading={loading.customers}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  style={{ width: "100%" }}
                >
                  {customers.map((customer) => (
                    <Select.Option key={customer.id} value={customer.id}>
                      {customer.name}
                    </Select.Option>
                  ))}
                </Select>
              </td>
            </tr>
            <tr>
              <td>手机号码：</td>
              <td>
                <Input
                  value={data.customerInfo?.phone || ""}
                  placeholder={
                    data.customerInfo?.exists === false
                      ? "客户不存在"
                      : "选择客户后自动填充"
                  }
                  disabled={true}
                  status={
                    data.customerInfo?.exists === false ? "error" : undefined
                  }
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="form-section">
        <h3>产品信息</h3>
        <table>
          <tbody>
            <tr>
              <td>产品名称：</td>
              <td style={{ position: "relative" }}>
                {data.productInfo?.exists === false && (
                  <div style={{ marginBottom: "8px" }}>
                    <Input
                      value={data.productInfo.name}
                      disabled={true}
                      status="error"
                      suffix={
                        <ExclamationCircleFilled
                          style={{
                            color: "#ff4d4f",
                          }}
                        />
                      }
                    />
                  </div>
                )}
                <Select
                  value={
                    data.productInfo?.exists ? data.productInfo?.id : undefined
                  }
                  onChange={handleProductChange}
                  placeholder={
                    data.productInfo?.exists === false
                      ? "请选择其他产品"
                      : "请选择产品"
                  }
                  disabled={disabled}
                  loading={loading.products}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  style={{ width: "100%" }}
                >
                  {products.map((product) => (
                    <Select.Option key={product.id} value={product.id}>
                      {product.name}
                    </Select.Option>
                  ))}
                </Select>
              </td>
            </tr>
            <tr>
              <td>数量：</td>
              <td>
                <InputNumber
                  value={data.productInfo?.quantity}
                  onChange={handleQuantityChange}
                  placeholder="请输入数量"
                  min={1}
                  disabled={disabled}
                  style={{ width: "100%" }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="form-section">
        <h3>司机信息</h3>
        <table>
          <tbody>
            <tr>
              <td>司机姓名：</td>
              <td style={{ position: "relative" }}>
                {data.driverInfo?.exists === false && (
                  <div style={{ marginBottom: "8px" }}>
                    <Input
                      value={data.driverInfo.name}
                      disabled={true}
                      status="error"
                      suffix={
                        <ExclamationCircleFilled
                          style={{
                            color: "#ff4d4f",
                          }}
                        />
                      }
                    />
                  </div>
                )}
                <Select
                  value={
                    data.driverInfo?.exists ? data.driverInfo?.id : undefined
                  }
                  onChange={handleDriverChange}
                  placeholder={
                    data.driverInfo?.exists === false
                      ? "请选择其他司机"
                      : "请选择司机"
                  }
                  disabled={disabled}
                  loading={loading.drivers}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  style={{ width: "100%" }}
                >
                  {drivers.map((driver) => (
                    <Select.Option key={driver.id} value={driver.id}>
                      {driver.name}
                    </Select.Option>
                  ))}
                </Select>
              </td>
            </tr>
            <tr>
              <td>手机号码：</td>
              <td>
                <Input
                  value={data.driverInfo?.phone || ""}
                  placeholder={
                    data.driverInfo?.exists === false
                      ? "司机不存在"
                      : "选择司机后自动填充"
                  }
                  disabled={true}
                  status={
                    data.driverInfo?.exists === false ? "error" : undefined
                  }
                />
              </td>
            </tr>
            <tr>
              <td>车牌号码：</td>
              <td>
                <Input
                  value={data.driverInfo?.licensePlate || ""}
                  placeholder={
                    data.driverInfo?.exists === false
                      ? "司机不存在"
                      : "选择司机后自动填充"
                  }
                  disabled={true}
                  status={
                    data.driverInfo?.exists === false ? "error" : undefined
                  }
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderForm;
