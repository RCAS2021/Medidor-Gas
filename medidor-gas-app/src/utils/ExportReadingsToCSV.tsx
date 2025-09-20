import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";

interface Reading {
  id: string | number;
  display_string: string;
  note?: string;
  recorded_at: string | Date;
}

interface ProcessedReading extends Reading {
  numericValue: number;
  month: string;
  dailyDifference: string;
  daysSinceLastReading: number;
}

interface MonthlySummary {
  month: string;
  startValue: number;
  endValue: number;
  totalConsumption: number;
  totalDays: number;
  averageDaily: number;
  readingsCount: number;
}

function extractNumericValue(displayString: string): number {
  const cleaned = displayString.replace(/\s+/g, "");
  const numeric = parseFloat(cleaned) || 0;
  return numeric;
}

function processReadingsData(readings: Reading[]): {
  processedReadings: ProcessedReading[];
  monthlySummaries: MonthlySummary[];
} {
  const sortedReadings = [...readings].sort((a, b) => {
    const dateA = new Date(a.recorded_at).getTime();
    const dateB = new Date(b.recorded_at).getTime();
    return dateA - dateB;
  });

  const processedReadings: ProcessedReading[] = [];
  const monthlyData: { [key: string]: Reading[] } = {};

  sortedReadings.forEach((reading, index) => {
    const currentDate = new Date(reading.recorded_at);
    const currentValue = extractNumericValue(reading.display_string);

    const month = currentDate.toLocaleDateString("pt-BR", {
      month: "2-digit",
      year: "numeric",
    });

    if (!monthlyData[month]) {
      monthlyData[month] = [];
    }
    monthlyData[month].push(reading);

    let dailyDifference = "0";
    let daysSinceLastReading = 0;

    if (index > 0) {
      const previousReading = sortedReadings[index - 1];
      const previousDate = new Date(previousReading.recorded_at);
      const previousValue = extractNumericValue(previousReading.display_string);

      const timeDiff = currentDate.getTime() - previousDate.getTime();
      daysSinceLastReading = Math.ceil(timeDiff / (1000 * 3600 * 24));

      const totalDifference = currentValue - previousValue;

      if (totalDifference >= 0) {
        dailyDifference = totalDifference.toFixed(2);
      } else {
        dailyDifference = "Reset";
      }
    }

    processedReadings.push({
      ...reading,
      numericValue: currentValue,
      month,
      dailyDifference,
      daysSinceLastReading,
    });
  });

  const monthlySummaries: MonthlySummary[] = Object.entries(monthlyData)
    .map(([month, monthReadings]) => {
      const sortedMonthReadings = monthReadings.sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );

      const startValue = extractNumericValue(
        sortedMonthReadings[0].display_string
      );
      const endValue = extractNumericValue(
        sortedMonthReadings[sortedMonthReadings.length - 1].display_string
      );
      const totalConsumption = endValue - startValue;

      const firstDate = new Date(sortedMonthReadings[0].recorded_at);
      const lastDate = new Date(
        sortedMonthReadings[sortedMonthReadings.length - 1].recorded_at
      );
      const totalDays =
        Math.ceil(
          (lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24)
        ) || 1;

      const averageDaily = totalDays > 0 ? totalConsumption / totalDays : 0;

      return {
        month,
        startValue,
        endValue,
        totalConsumption,
        totalDays,
        averageDaily: parseFloat(averageDaily.toFixed(2)),
        readingsCount: monthReadings.length,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  return { processedReadings, monthlySummaries };
}

export async function exportReadingsToCsv(
  apartmentNumber: string,
  readings: Reading[]
): Promise<boolean> {
  try {
    if (!readings || readings.length === 0) {
      Alert.alert("Aviso", "Nenhum registro encontrado para exportar.");
      return false;
    }

    const { processedReadings, monthlySummaries } =
      processReadingsData(readings);

    const detailHeader =
      "Apartamento,ID,Valor,Valor_Numerico,Mes,Diferenca_Total,Dias_Entre_Leituras,Observacao,Data\n";
    const detailRows = processedReadings
      .map((reading) => {
        const apartment = apartmentNumber;
        const id = reading.id || "";
        const value = (reading.display_string || "").replace(/"/g, '""');
        const numericValue = reading.numericValue;
        const month = reading.month;
        const dailyDifference = reading.dailyDifference;
        const daysBetween = reading.daysSinceLastReading;
        const note = (reading.note || "")
          .replace(/"/g, '""')
          .replace(/\n/g, " ");
        const date = new Date(reading.recorded_at).toLocaleString("pt-BR");

        return `"${apartment}","${id}","${value}","${numericValue}","${month}","${dailyDifference}","${daysBetween}","${note}","${date}"`;
      })
      .join("\n");

    const summaryHeader =
      "Apartamento,Mes,Valor_Inicial,Valor_Final,Consumo_Total,Dias_Total,Media_Diaria,Qtd_Leituras\n";
    const summaryRows = monthlySummaries
      .map((summary) => {
        return `"${apartmentNumber}","${summary.month}","${summary.startValue}","${summary.endValue}","${summary.totalConsumption}","${summary.totalDays}","${summary.averageDaily}","${summary.readingsCount}"`;
      })
      .join("\n");

    const detailCsv = detailHeader + detailRows;
    const summaryCsv = summaryHeader + summaryRows;

    if (Platform.OS === "web") {
      const detailBlob = new Blob([detailCsv], {
        type: "text/csv;charset=utf-8;",
      });
      const detailLink = document.createElement("a");
      const detailUrl = URL.createObjectURL(detailBlob);

      detailLink.setAttribute("href", detailUrl);
      detailLink.setAttribute(
        "download",
        `leituras_detalhadas_ap_${apartmentNumber}.csv`
      );
      detailLink.style.visibility = "hidden";
      document.body.appendChild(detailLink);
      detailLink.click();
      document.body.removeChild(detailLink);

      setTimeout(() => {
        const summaryBlob = new Blob([summaryCsv], {
          type: "text/csv;charset=utf-8;",
        });
        const summaryLink = document.createElement("a");
        const summaryUrl = URL.createObjectURL(summaryBlob);

        summaryLink.setAttribute("href", summaryUrl);
        summaryLink.setAttribute(
          "download",
          `resumo_mensal_ap_${apartmentNumber}.csv`
        );
        summaryLink.style.visibility = "hidden";
        document.body.appendChild(summaryLink);
        summaryLink.click();
        document.body.removeChild(summaryLink);

        Alert.alert(
          "✅ Arquivos Baixados!",
          `Dois arquivos CSV foram baixados:\n\n📋 leituras_detalhadas_ap_${apartmentNumber}.csv\n📊 resumo_mensal_ap_${apartmentNumber}.csv`
        );
      }, 1000);

      return true;
    } else {
      Alert.alert(
        "Escolher Arquivo",
        "Qual arquivo você quer copiar para área de transferência?",
        [
          {
            text: "Leituras Detalhadas",
            onPress: async () => {
              await Clipboard.setStringAsync(detailCsv);
              Alert.alert(
                "Copiado!",
                `Leituras detalhadas do apartamento ${apartmentNumber} copiadas.\n\nCole em uma planilha para visualizar.`
              );
            },
          },
          {
            text: "Resumo Mensal",
            onPress: async () => {
              await Clipboard.setStringAsync(summaryCsv);
              Alert.alert(
                "Copiado!",
                `Resumo mensal do apartamento ${apartmentNumber} copiado.\n\nCole em uma planilha para visualizar.`
              );
            },
          },
          {
            text: "Ambos Juntos",
            onPress: async () => {
              const combinedContent = `${detailCsv}\n\n${summaryCsv}`;
              await Clipboard.setStringAsync(combinedContent);
              Alert.alert(
                "Copiado!",
                "Ambos os arquivos foram copiados juntos.\n\nSepare manualmente ao colar na planilha."
              );
            },
          },
          { text: "Cancelar", style: "cancel" },
        ]
      );
      return true;
    }
  } catch (error) {
    console.error("Erro ao exportar CSV:", error);
    Alert.alert("Erro", "Falha ao exportar os arquivos CSV.");
    return false;
  }
}

/*
export function previewSeparateData(readings: Reading[]) {
  const { processedReadings, monthlySummaries } = processReadingsData(readings);

  console.log(
    `📋 LEITURAS DETALHADAS (${processedReadings.length} registros):`
  );
  processedReadings.slice(0, 3).forEach((reading) => {
    console.log(
      `  ${reading.id}: ${reading.numericValue} (${reading.month}) - Dif: ${reading.dailyDifference}`
    );
  });

  console.log(`📊 RESUMO MENSAL (${monthlySummaries.length} meses):`);
  monthlySummaries.forEach((summary) => {
    console.log(
      `  ${summary.month}: ${summary.totalConsumption} total | ${summary.averageDaily}/dia | ${summary.readingsCount} leituras`
    );
  });

  return {
    detailCount: processedReadings.length,
    summaryCount: monthlySummaries.length,
  };
}
*/
