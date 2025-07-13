import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import LinearGradient from 'react-native-linear-gradient';
import SplashScreen from 'react-native-splash-screen';

const { width, height } = Dimensions.get('window');

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);

  useEffect(() => {
    // Hide splash screen after component mounts
    const timer = setTimeout(() => {
      SplashScreen.hide();
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleWebViewLoad = () => {
    setIsLoading(false);
  };

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    setIsLoading(false);
  };

  const renderSplashScreen = () => (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.splashContainer}
    >
      <View style={styles.splashContent}>
        <Text style={styles.splashTitle}>📊</Text>
        <Text style={styles.splashTitle}>Order Matching</Text>
        <Text style={styles.splashSubtitle}>Trading Platform</Text>
        <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
        <Text style={styles.splashText}>Loading secure trading interface...</Text>
      </View>
    </LinearGradient>
  );

  const renderWebView = () => (
    <WebView
      key={webViewKey}
      source={{ uri: 'http://localhost:3001' }}
      style={styles.webview}
      onLoad={handleWebViewLoad}
      onError={handleWebViewError}
      startInLoadingState={true}
      renderLoading={() => (
        <View style={styles.webviewLoading}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.webviewLoadingText}>Loading Order Matching System...</Text>
        </View>
      )}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
      mixedContentMode="compatibility"
      userAgent="OrderMatchingMobile/1.0"
      onHttpError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn('WebView HTTP error: ', nativeEvent);
      }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#667eea"
        translucent={true}
      />
      {isLoading ? renderSplashScreen() : renderWebView()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  splashTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  splashSubtitle: {
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
  },
  loader: {
    marginBottom: 20,
  },
  splashText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8,
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  webviewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#667eea',
    textAlign: 'center',
  },
});

export default App; 