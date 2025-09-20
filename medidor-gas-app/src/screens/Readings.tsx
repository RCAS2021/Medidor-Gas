import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { getReadingsByApartment, deleteReading } from "../api";
import { exportReadingsToCsv } from "../utils/ExportReadingsToCSV";

interface Reading {
  id: number;
  display_string: string;
  note: string;
  recorded_at: string;
}

interface MonthGroup {
  month: string;
  monthYear: string;
  readings: Reading[];
  totalReadings: number;
  startValue: number;
  endValue: number;
  consumption: number;
  consumptionFromPrevious?: number;
  isFirstMonth: boolean;
}

export default function Readings({ route, navigation }) {
  const { apartmentId, apartmentNumber } = route.params;
  const [readings, setReadings] = useState<Reading[]>([]);
  const [groupedReadings, setGroupedReadings] = useState<MonthGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const extractNumericValue = (displayString: string): number => {
    const cleaned = displayString.replace(/\s+/g, "");
    const numeric = parseFloat(cleaned) || 0;
    return numeric;
  };

  const groupReadingsByMonth = (readings: Reading[]): MonthGroup[] => {
    const sortedReadings = [...readings].sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    const groups: { [key: string]: Reading[] } = {};

    sortedReadings.forEach((reading) => {
      const date = new Date(reading.recorded_at);
      const monthKey = date.toLocaleDateString("pt-BR", {
        month: "2-digit",
        year: "numeric",
      });

      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(reading);
    });

    const monthGroups: MonthGroup[] = Object.entries(groups)
      .map(([monthKey, monthReadings]) => {
        const sortedMonthReadings = [...monthReadings].sort(
          (a, b) =>
            new Date(a.recorded_at).getTime() -
            new Date(b.recorded_at).getTime()
        );

        const startValue = extractNumericValue(
          sortedMonthReadings[0].display_string
        );
        const endValue = extractNumericValue(
          sortedMonthReadings[sortedMonthReadings.length - 1].display_string
        );
        const consumption = endValue - startValue;

        const date = new Date(monthReadings[0].recorded_at);
        const monthName = date.toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        });

        return {
          month: monthKey,
          monthYear: monthName,
          readings: monthReadings.sort(
            (a, b) =>
              new Date(b.recorded_at).getTime() -
              new Date(a.recorded_at).getTime()
          ),
          totalReadings: monthReadings.length,
          startValue,
          endValue,
          consumption: Math.max(0, consumption),
          consumptionFromPrevious: undefined,
          isFirstMonth: false,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    monthGroups.forEach((monthGroup, index) => {
      if (index === 0) {
        monthGroup.isFirstMonth = true;
        monthGroup.consumptionFromPrevious = monthGroup.endValue;
      } else {
        const previousMonth = monthGroups[index - 1];
        const currentValue = monthGroup.endValue;
        const previousValue = previousMonth.endValue;

        const realConsumption = Math.abs(currentValue - previousValue);
        monthGroup.consumptionFromPrevious = realConsumption;
        monthGroup.isFirstMonth = false;
      }
    });

    return monthGroups.reverse();
  };

  const loadReadings = async () => {
    setLoading(true);
    const data = await getReadingsByApartment(apartmentId);
    setReadings(data);

    const grouped = groupReadingsByMonth(data);
    setGroupedReadings(grouped);

    setLoading(false);
  };

  useEffect(() => {
    loadReadings();
  }, [apartmentId]);

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir esta leitura?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const ok = await deleteReading(id);
            if (ok) {
              loadReadings();
            } else {
              Alert.alert("Erro", "Erro ao excluir leitura.");
            }
          },
        },
      ]
    );
  };

  const handleExportCSV = async () => {
    const success = await exportReadingsToCsv(apartmentNumber, readings);
    if (!success) {
      Alert.alert("Erro", "Falha ao exportar dados.");
    }
  };

  const renderMonthHeader = (monthGroup: MonthGroup) => (
    <View style={styles.monthHeader}>
      <View style={styles.monthTitleContainer}>
        <Text style={styles.monthTitle}>{monthGroup.monthYear}</Text>
        <Text style={styles.monthStats}>
          {monthGroup.totalReadings} leitura
          {monthGroup.totalReadings !== 1 ? "s" : ""}
        </Text>
      </View>

      <View style={styles.monthSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Inicial:</Text>
          <Text style={styles.summaryValue}>{monthGroup.startValue}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Final:</Text>
          <Text style={styles.summaryValue}>{monthGroup.endValue}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>
            {monthGroup.isFirstMonth ? "1ª leitura:" : "Dif. Mês Ant.:"}
          </Text>
          <Text style={[styles.summaryValue, styles.consumptionValue]}>
            {monthGroup.isFirstMonth
              ? monthGroup.consumption > 0
                ? `+${monthGroup.consumption}`
                : `${monthGroup.consumption}`
              : monthGroup.consumptionFromPrevious > 0
              ? `+${monthGroup.consumptionFromPrevious}`
              : `${monthGroup.consumptionFromPrevious}`}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderReading = (reading: Reading) => (
    <View key={reading.id} style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.readingValue}>{reading.display_string}</Text>
          {reading.note ? (
            <Text style={styles.readingNote}>{reading.note}</Text>
          ) : null}
          <Text style={styles.readingDate}>
            {new Date(reading.recorded_at).toLocaleString("pt-BR")}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => handleDelete(reading.id)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteX}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Carregando leituras...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Leituras do Apartamento {apartmentNumber}
        </Text>
        <Text style={styles.subtitle}>
          Total: {readings.length} leitura{readings.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate("AddReading", {
              apartmentId,
              apartmentNumber,
              onAdded: loadReadings,
            })
          }
        >
          <Text style={styles.buttonText}>+ Adicionar Leitura</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
          <Text style={styles.buttonText}>📊 Exportar CSV</Text>
        </TouchableOpacity>
      </View>

      {groupedReadings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma leitura encontrada</Text>
          <Text style={styles.emptySubtext}>
            Adicione a primeira leitura do apartamento
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedReadings}
          keyExtractor={(item) => item.month}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item: monthGroup }) => (
            <View style={styles.monthContainer}>
              {renderMonthHeader(monthGroup)}
              {monthGroup.readings.map((reading) => renderReading(reading))}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 15,
    gap: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  addButton: {
    flex: 1,
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  exportButton: {
    flex: 1,
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    paddingBottom: 20,
  },
  monthContainer: {
    marginBottom: 20,
  },
  monthHeader: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  monthTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A90E2",
    textTransform: "capitalize",
  },
  monthStats: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f0f8ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  monthSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryItem: {
    alignItems: "center",
    minWidth: 70,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 2,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  consumptionValue: {
    color: "#28a745",
  },
  monthConsumptionValue: {
    color: "#17a2b8",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginVertical: 4,
    borderRadius: 8,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  readingValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  readingNote: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    fontStyle: "italic",
  },
  readingDate: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    padding: 8,
  },
  deleteX: {
    fontSize: 24,
    color: "#ff4444",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
