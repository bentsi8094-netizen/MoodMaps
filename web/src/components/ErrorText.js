import React from 'react';
import { Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';

const ErrorText = ({ error }) => {
  if (!error) return null;

  return (
    <Animatable.Text 
      animation="shake" 
      duration={500}
      style={styles.error}
    >
      {error}
    </Animatable.Text>
  );
};

const styles = StyleSheet.create({
  error: {
    color: '#ff4d4d',
    fontSize: 12,
    marginBottom: 8,
    marginRight: 5,
    fontWeight: '500',
    textAlign: 'right'
  }
});

export default ErrorText;
