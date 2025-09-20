import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Apartments from "./src/screens/Apartments";
import Readings from "./src/screens/Readings";
import AddReading from "./src/screens/AddReading";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Apartments">
        <Stack.Screen name="Apartments" component={Apartments} />
        <Stack.Screen name="Readings" component={Readings} />
        <Stack.Screen name="AddReading" component={AddReading} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
