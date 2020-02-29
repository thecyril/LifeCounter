import React from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import * as firebase from 'firebase';

export default class LoadingPage extends React.Component {
  componentDidMount(): void {
    firebase.auth().onAuthStateChanged(user => {
      this.props.navigation.navigate(user ? 'App' : 'Auth');
    });
  }
  render() {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
        <ActivityIndicator size="large" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
