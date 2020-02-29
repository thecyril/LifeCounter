/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from 'react';
import {createAppContainer, createSwitchNavigator} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
} from 'react-native';
import HomePage from './pages/home.page';
import LoadingPage from './pages/loading.page';
import LoginPage from './pages/login.page';
import RegisterPage from './pages/register.page';
import * as firebase from 'firebase';

var firebaseConfig = {
  apiKey: 'AIzaSyB4LTGrtpxS9nD30UBQRxsJ50pOIVxAufo',
  authDomain: 'lifecounter-78a8b.firebaseapp.com',
  databaseURL: 'https://lifecounter-78a8b.firebaseio.com',
  projectId: 'lifecounter-78a8b',
  storageBucket: 'lifecounter-78a8b.appspot.com',
  messagingSenderId: '731544916583',
  appId: '1:731544916583:web:aee702d5d5381b17fafac2',
  measurementId: 'G-RM03K24Q2J',
};

firebase.initializeApp(firebaseConfig);

const AppStack = createStackNavigator({
  Home: HomePage,
});

const AuthStack = createStackNavigator({
  Login: LoginPage,
  Register: RegisterPage,
});

export default createAppContainer(
  createSwitchNavigator(
    {
      Loading: LoadingPage,
      App: AppStack,
      Auth: AuthStack,
    },
    {
      initialRouteName: 'Loading',
    },
  ),
);
