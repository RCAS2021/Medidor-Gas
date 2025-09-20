const BASE_URL = "https://medidor-gas.vercel.app";

export const getTestMessage = async () => {
  try {
    const response = await fetch(`${BASE_URL}/test`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao chamar backend:", error);
    return null;
  }
};

export const getApartments = async () => {
  try {
    const response = await fetch(`${BASE_URL}/apartments/apartments`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar apartamentos:", error);
    return [];
  }
};

export const getReadingsByApartment = async (apartmentId: number) => {
  try {
    const response = await fetch(`${BASE_URL}/readings?apartmentId=${apartmentId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar leituras:", error);
    return [];
  }
};

export const addReading = async (reading: any) => {
  try {
    const response = await fetch(`${BASE_URL}/readings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reading),
    });
    return await response.json();
  } catch (error) {
    console.error("Erro ao adicionar leitura:", error);
    return null;
  }
};
