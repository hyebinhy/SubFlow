import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export function AppLogoMark() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/subflow-mark.png')}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
