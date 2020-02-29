import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import * as firebase from 'firebase';

export default class RegisterPage extends React.Component {
  state = {
    name: '',
    email: '',
    password: '',
    errorMessage: null,
  };

  handleRegister() {
    firebase
      .auth()
      .createUserWithEmailAndPassword(this.state.email, this.state.password)
      .then(userCredentials => {
        return userCredentials.user.updateProfile({
          displayName: this.state.name,
        });
      })
      .catch(error => {
        console.log(error);
        this.setState({errorMessage: error.message});
        console.log(this.state);
      });
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.greeting}>
          {'Bienvenue sur Life Counter !\nInscrivez-vous pour commencer'}
        </Text>
        <View style={styles.errorMessage}>
          <Text style={styles.error}>{this.state.errorMessage}</Text>
        </View>
        <View style={styles.form}>
          <View>
            <Text style={styles.inputTitle}>Nom complet</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              onChangeText={name => this.setState({name})}
              value={this.state.name}
            />
          </View>
          <View style={{marginTop: 32}}>
            <Text style={styles.inputTitle}>E-mail</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              onChangeText={email => this.setState({email})}
              value={this.state.email}
            />
          </View>
          <View style={{marginTop: 32}}>
            <Text style={styles.inputTitle}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              onChangeText={password => this.setState({password})}
              value={this.state.password}
            />
          </View>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => this.handleRegister()}>
          <Text style={{color: '#FFF', fontWeight: '500'}}>Inscrivez-vous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{alignSelf: 'center', marginTop: 32}}
          onPress={() => this.props.navigation.navigate('Login')}>
          <Text style={{color: '#414959', fontSize: 13}}>
            Déjà un compte sur Life Counter ?{' '}
            <Text style={{fontWeight: '500', color: '#E9446A'}}>
              Connectez-vous
            </Text>
          </Text>
        </TouchableOpacity>
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
  greeting: {
    marginTop: 32,
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
  },
  errorMessage: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 30,
  },
  error: {
    color: '#E9446A',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    marginBottom: 48,
    marginHorizontal: 30,
    paddingHorizontal: 20,
    width: '100%',
  },
  inputTitle: {
    color: '#8A8F9E',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  input: {
    borderBottomColor: '#8A8F9E',
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 40,
    fontSize: 15,
    color: '#161F3D',
  },
  button: {
    marginHorizontal: 30,
    backgroundColor: '#E9446A',
    borderRadius: 4,
    height: 52,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
