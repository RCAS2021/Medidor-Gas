import axios from "axios";

const BASE_URL = "https://medidor-gas.vercel.app";

export const getApartments = async () => {
  const res = await axios.get(`${BASE_URL}/apartments`);
  return res.data;
};

export const getReadingsByApartment = async (apartmentId: number) => {
  const res = await axios.get(
    `${BASE_URL}/readings?apartmentId=${apartmentId}`
  );
  return res.data;
};

export const addReading = async (
  apartmentId: number,
  displayString: string,
  note: string
) => {
  try {
    const response = await fetch(`${BASE_URL}/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apartment_id: apartmentId,
        display_string: displayString,
        note,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Erro ao adicionar leitura:", error);
    return false;
  }
};

export async function deleteReading(id: number) {
  try {
    const response = await fetch(`${BASE_URL}/readings/${id}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch (error) {
    console.error("Erro ao deletar leitura:", error);
    return false;
  }
}
