import React from 'react';
import { Image, StyleSheet } from 'react-native';

export function AppLogoMark() {
  return (
    <Image
      source={require('../../assets/subflow-logo.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 92,
    height: 30,
  },
});
