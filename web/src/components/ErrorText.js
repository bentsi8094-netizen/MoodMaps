import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
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
    fontSize: 11,
    marginTop: -10,
    marginBottom: 10,
    marginRight: 10,
    fontWeight: '600',
    textAlign: 'right',
    ...Platform.select({
      web: {
        textShadow: '0px 1px 1px rgba(0, 0, 0, 0.3)'
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
      }
    })
  }
});

export default ErrorText;
