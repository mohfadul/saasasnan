import React, { Suspense, ComponentType } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface LazyScreenProps {
  component: ComponentType<any>;
  fallback?: ComponentType<any>;
}

const DefaultFallback: React.FC = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

const LazyScreen: React.FC<LazyScreenProps> = ({ 
  component: Component, 
  fallback: Fallback = DefaultFallback 
}) => {
  return (
    <Suspense fallback={<Fallback />}>
      <Component />
    </Suspense>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default LazyScreen;

