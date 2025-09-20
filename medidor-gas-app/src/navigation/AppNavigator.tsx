import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import Apartments from "../screens/Apartments";
import Readings from "../screens/Readings";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Apartamentos" component={Apartments} />
        <Stack.Screen name="Leituras" component={Readings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
