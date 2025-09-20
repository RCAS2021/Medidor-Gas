import React, { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { getApartments } from "../api";
import ApartmentCard from "../components/ApartmentCard";

export default function Apartments({ navigation }) {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApartments()
      .then(setApartments)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <FlatList
        data={apartments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ApartmentCard
            id={item.id}
            number={item.number}
            onPress={() =>
              navigation.navigate("Readings", {
                apartmentId: item.id,
                apartmentNumber: item.number,
              })
            }
          />
        )}
        style={styles.apartment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  apartment: { marginBottom: 16 },
});
