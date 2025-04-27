import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: "/api", // Đường dẫn cơ sở cho API
  timeout: 10000, // 10s timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Ví dụ: tự động đính kèm token nếu cần
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Xử lý lỗi trả về từ server
      console.error("API Error:", error.response.data);
      
      // Tạo error message từ response hoặc sử dụng message mặc định
      const errorMessage = 
        error.response.data.message || 
        error.response.data.error || 
        error.response.statusText || 
        "Đã xảy ra lỗi khi giao tiếp với máy chủ";
      
      // Throw error với message đã xử lý
      throw new Error(errorMessage);
    }
    
    // Xử lý lỗi không có response (network error, timeout, etc.)
    if (error.request) {
      console.error("Network Error:", error.request);
      throw new Error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.");
    }
    
    // Các lỗi khác
    console.error("Error:", error.message);
    throw error;
  }
);

// API Methods
const apiService = {
  get: (url, params = {}, config = {}) => api.get(url, { params, ...config }),
  post: (url, data = {}, config = {}) => api.post(url, data, { ...config }),
  put: (url, data = {}, config = {}) => api.put(url, data, { ...config }),
  patch: (url, data = {}, config = {}) => api.patch(url, data, { ...config }),
  delete: (url, config = {}) => api.delete(url, { ...config }),
};

export default apiService;
