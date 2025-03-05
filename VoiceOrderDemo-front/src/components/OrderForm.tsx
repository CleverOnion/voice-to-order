import React from "react";
import "./OrderForm.css";

interface OrderData {
  customerInfo: {
    name: string;
  } | null;
  productInfo: {
    name: string;
    quantity: number;
  } | null;
  driverInfo: {
    name: string;
  } | null;
}

interface OrderFormProps {
  data: OrderData;
}

const OrderForm: React.FC<OrderFormProps> = ({ data }) => {
  return (
    <div className="order-form">
      <div className="form-section">
        <h3>客户信息</h3>
        <table>
          <tbody>
            <tr>
              <td>客户姓名：</td>
              <td>{data.customerInfo?.name || "等待输入..."}</td>
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
              <td>{data.productInfo?.name || "等待输入..."}</td>
            </tr>
            <tr>
              <td>数量：</td>
              <td>{data.productInfo?.quantity || "等待输入..."}</td>
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
              <td>{data.driverInfo?.name || "等待输入..."}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderForm;
