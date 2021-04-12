import axios from "axios";
const token =
  "eIts6wCTyUyFfMjGTu1KKtiTPKfGQAr3Ixsy6Xd4Gy5HMir_Pvat2QZlGP39ZkY83N2Au-g6jgoYM7gUnYPdq97EaW9RtwjfOPJnWqx-3Mq3GJ5L79mIPGubHr4T5n2bjO9T775pYE81-pqgIRwP4I9BW3NLw2Ccn5dGZD9hkNcG3JahuOZA7YQMBWSz4w-aoOwjNj0FXTYE3-W4vklY4_EbWbRd56ia1RTSUL8A6OBXItHtfUevGxXf0JF-2Ms01xA4v_spxHb4jbrRYanlAKbR_waeoBNZNeymNdzr8SygtgHHzl0s4hMWRD3JqD3PVIBk7xMNO4XAU2HuRf3WblWRl1RMSA5-NY4E6cvmNmIuhQprVB2fzihlSpom8tQordBQBwJKMT0pS0-EVsc5qt5TzpMnyZotoUnQ04bYZXuZc85-MjzR6XSM87RGjdiUp0V-23BFRbSjAAdWeIyTBPbHhqK4I-zewjwPI-RY90g";
export const config = {
  headers: { Authorization: `Bearer ${token}` },
};

axios.interceptors.response.use(null, (error) => {
  const expectedError =
    error.response &&
    error.response.status >= 400 &&
    error.response.status < 500;

  if (!expectedError) {
    console.log("Logging the error", error);
    alert("An unexpected error occurred");
  }
  return Promise.reject(error);
});

export default {
  config,
  get: axios.get,
  post: axios.post,
  put: axios.put,
  delete: axios.delete,
};
