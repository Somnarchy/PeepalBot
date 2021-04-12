import httpService from "./httpService";
import config from "../../config.json";

export const endPoint = `${config.apiEndPoint}/documenttype`;
export async function getData() {
  const response = await httpService.get(`${endPoint}`, httpService.config);
  return response.data;
}

export async function getDataById(id) {
  const response = await httpService.get(`${endPoint}`, httpService.config);
  return response.data;
}
export async function save(data) {
  const { data: result } = await httpService.post(
    `${endPoint}`,
    data,
    httpService.config
  );
  return result;
}
export async function update(data) {
  const { data: result } = await httpService.put(
    `${endPoint}/${data.id}`,
    data,
    httpService.config
  );
  return result;
}
export async function remove(id) {
  const { data: result } = await httpService.delete(
    `${endPoint}/${id}`,
    httpService.config
  );
  return result;
}
