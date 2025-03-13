export const API_BASE_URL = "http://localhost:8080/api";

// 语音识别相关接口
export const RECOGNITION_API = {
  PROCESS: `${API_BASE_URL}/recognition/process`,
  RESET: `${API_BASE_URL}/recognition/reset`,
};

// 行话管理相关接口
export const JARGON_API = {
  BASE: `${API_BASE_URL}/jargons`,
  PAGE: `${API_BASE_URL}/jargons/page`,
  BY_ID: (id: number) => `${API_BASE_URL}/jargons/${id}`,
};

// 产品管理相关接口
export const PRODUCT_API = {
  BASE: `${API_BASE_URL}/products`,
  BY_ID: (id: number) => `${API_BASE_URL}/products/${id}`,
};

// 客户管理相关接口
export const CUSTOMER_API = {
  BASE: `${API_BASE_URL}/customers`,
  BY_ID: (id: number) => `${API_BASE_URL}/customers/${id}`,
};

// 司机管理相关接口
export const DRIVER_API = {
  BASE: `${API_BASE_URL}/drivers`,
  BY_ID: (id: number) => `${API_BASE_URL}/drivers/${id}`,
};
