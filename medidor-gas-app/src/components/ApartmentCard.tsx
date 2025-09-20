import React from "react";
import { TouchableOpacity, Text, StyleSheet, View, Button } from "react-native";
import { exportReadingsToCsv } from "../utils/ExportReadingsToCSV";

interface Props {
  id: number;
  number: string;
  onPress: () => void;
}

export default function ApartmentCard({ id, number, onPress }: Props) {
  const handleExport = async () => {
    try {
      const res = await fetch(
        `https://medidor-gas.vercel.app/readings?apartmentId=${id}`
      );
      const readings = await res.json();
      await exportReadingsToCsv(number, readings);
    } catch (err) {
      console.error("Erro ao exportar:", err);
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
        <Text style={styles.text}>Apartamento - {number}</Text>
      </TouchableOpacity>

      <Button title="Exportar CSV" onPress={handleExport} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: "#e0f7fa",
    borderRadius: 8,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
});
