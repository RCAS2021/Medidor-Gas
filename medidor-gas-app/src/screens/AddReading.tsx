import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { addReading } from "../api";

export default function AddReading({ route, navigation }) {
  const { apartmentId, apartmentNumber } = route.params;

  const [displayString, setDisplayString] = useState("");
  const [note, setNote] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(status === "granted");
    })();
  }, []);

  const takePhoto = async () => {
    if (!hasCameraPermission) {
      Alert.alert("Permissão negada para usar a câmera");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      extractTextFromPhoto(result.assets[0].base64!);
    }
  };

  const extractTextFromPhoto = async (base64: string) => {
    try {
      setLoadingOCR(true);

      const response = await fetch(`https://medidor-gas.vercel.app/ocr/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await response.json();
      const text = data.ParsedResults?.[0]?.ParsedText || "";
      const cleanedText = text.replace(/\s/g, "").trim();
      setDisplayString(cleanedText);

      if (!cleanedText) Alert.alert("Nenhum texto detectado na imagem.");
    } catch (error) {
      console.error("Erro no OCR:", error);
      Alert.alert("Erro ao processar a imagem.");
    } finally {
      setLoadingOCR(false);
    }
  };

  const handleSave = async () => {
    if (!displayString) {
      Alert.alert("Preencha o valor da leitura");
      return;
    }

    const result = await addReading(apartmentId, displayString, note);

    if (result) {
      Alert.alert("Leitura registrada com sucesso");
      if (route.params?.onAdded) route.params.onAdded();
      navigation.goBack();
    } else {
      Alert.alert("Erro ao registrar leitura.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Adicionar leitura - Ap. {apartmentNumber}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Valor da leitura"
        value={displayString}
        onChangeText={setDisplayString}
      />

      <TextInput
        style={styles.input}
        placeholder="Observação (opcional)"
        value={note}
        onChangeText={setNote}
      />

      {photoUri && <Image source={{ uri: photoUri }} style={styles.photo} />}
      {loadingOCR && (
        <ActivityIndicator size="large" style={{ marginVertical: 10 }} />
      )}

      <Button title="Tirar foto" onPress={takePhoto} />
      <Button title="Salvar leitura" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 4 },
  title: { fontSize: 20, marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
  },
  photo: { width: "100%", height: 200, marginBottom: 15 },
  button: { marginBottom: 16 },
});
