import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  AsyncStorage,
  Dimensions,
  ScrollView,
  FlatList,
} from 'react-native';
import ImagePicker from 'react-native-image-picker';
import * as firebase from 'firebase';
import RNFetchBlob from 'react-native-fetch-blob';
import {v4 as uuidv4} from 'uuid';
const Blob = RNFetchBlob.polyfill.Blob;
const fs = RNFetchBlob.fs;
window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest;
window.Blob = Blob;

const ImageRow = ({image, windowWidth, popImage}) => (
  <View>
    <Image
      source={{uri: image}}
      style={[styles.img, {width: windowWidth / 2 - 15}]}
      onError={popImage}
    />
    <TouchableOpacity
      onPress={() => {
        popImage();
      }}>
      <Text>Remove</Text>
    </TouchableOpacity>
  </View>
);

export default class HomePage extends React.Component {
  options = {
    title: 'Select Image',
    storageOptions: {
      skipBackup: true,
      path: 'images',
    },
  };
  state = {
    userId: '',
    email: '',
    displayName: '',
    profilePicture: '',
    progress: 0,
    uploading: false,
    images: [],
    imageUri: '',
  };
  uploadImage = () => {
    if (this.state.images.length > 0) {
      this.removeImage(0);
    }
    // const ext = this.state.imageUri.split('.').pop(); // Extract image extension
    // const filename = `${Math.random()}.${ext}`; // Generate unique name
    const filename = this.state.userId;
    this.setState({uploading: true});
    console.log('upload image', filename.toString());
    console.log(this.state.imageUri);
    // console.log(firebase.storage().ref(`images/${filename.toString()}`).putString( this.state.imageUri));
    console.log('after');
    let uploadBlob;
    const imageRef = firebase
      .storage()
      .ref('images')
      .child(filename.toString());
    fs.readFile(this.state.imageUri, 'base64')
      .then(data => {
        return Blob.build(data, {
          type: `${'application/octet-stream'};BASE64`,
        });
      })
      .then(blob => {
        uploadBlob = blob;
        return imageRef.put(blob, {contentType: 'application/octet-stream'});
      })
      .then(() => {
        uploadBlob.close();
        return imageRef.getDownloadURL();
      })
      .then(url => {
        const allImages = this.state.images;
        let state = {};

        allImages.push(url);
        state = {
          ...state,
          uploading: false,
          // profilePicture: '',
          imageUri: '',
          progress: 0,
          images: allImages,
        };
        this.setState(state);
        AsyncStorage.setItem('images', JSON.stringify(allImages));
      })
      .catch(error => {
        console.log('error', error);
      });
  };
  pickImage = () => {
    ImagePicker.showImagePicker(this.options, response => {
      if (response.error) {
        console.log(response.error);
        alert('Erreur: ', response.error);
      } else {
        const source = {uri: response.uri};
        this.setState({
          profilePicture: source,
          imageUri: response.uri,
        });
        this.uploadImage();
      }
    });
  };
  removeImage = imageIndex => {
    console.log('pop');
    let images = this.state.images;
    console.log('image to delete', images[imageIndex]);
    firebase
      .storage()
      .refFromURL(images[imageIndex])
      .delete()
      .then(afterDelete => {
        images.pop(imageIndex);
        this.setState({images});
        AsyncStorage.setItem('images', JSON.stringify(images));
      });
  };
  async componentDidMount(): void {
    await this.updateCurrentUser();
    let images;
    let path = 'images/' + this.state.userId;
    console.log(firebase.storage().ref(path));
    let url = await firebase
      .storage()
      .ref(path)
      .getDownloadURL();
    AsyncStorage.getItem('images')
      .then(data => {
        images = JSON.parse(data) || [];
        this.setState({
          ...this.state,
          images: images,
          profilePicture: url,
        });
        console.log('profile', this.state.profilePicture);
      })
      .catch(error => {
        console.log(error);
      });
  }
  updateCurrentUser(): void {
    const {email, displayName} = firebase.auth().currentUser;
    const userId = firebase.auth().currentUser.uid;
    console.log('userId', userId);
    this.setState({userId, email, displayName});
  }

  signOutUser() {
    firebase.auth().signOut();
  }

  render() {
    const {uploading, profilePicture, progress, images} = this.state;
    const windowWidth = Dimensions.get('window').width;
    const disabledStyle = uploading ? styles.disabledBtn : {};
    const actionBtnStyles = [styles.btn, disabledStyle];
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Life Counter</Text>
        <Text style={{marginTop: 32}}>Bonjour {this.state.email}</Text>
        <TouchableOpacity
          style={actionBtnStyles}
          onPress={this.pickImage}
          disabled={uploading}>
          <View>
            <Text style={styles.btnTxt}>Choisir une photo de profil</Text>
          </View>
        </TouchableOpacity>
        {profilePicture !== '' && (
          <View>
            <Image
              source={{uri: profilePicture.toString()}}
              style={styles.image}
            />
          </View>
        )}
        <TouchableOpacity
          style={{marginTop: 32}}
          onPress={() => this.signOutUser()}>
          <Text>Deconnexion</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  btn: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 20,
    backgroundColor: 'rgb(3, 154, 229)',
    marginTop: 20,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: 'rgba(3,155,229,0.5)',
  },
  btnTxt: {
    color: '#fff',
  },
  image: {
    marginTop: 20,
    minWidth: 100,
    height: 200,
    resizeMode: 'contain',
    backgroundColor: '#ccc',
  },
  img: {
    flex: 1,
    height: 100,
    margin: 5,
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#ccc',
  },
  progressBar: {
    backgroundColor: 'rgb(3, 154, 229)',
    height: 3,
    shadowColor: '#000',
  },
});
