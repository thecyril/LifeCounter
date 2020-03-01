import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableHighlight,
  TextInput,
  Image,
  AsyncStorage,
  Dimensions,
  Alert,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import Popover from 'react-native-popover-view';
import Icon from 'react-native-vector-icons/FontAwesome';
import ImagePicker from 'react-native-image-picker';
import * as firebase from 'firebase';
import {CardViewWithIcon} from 'react-native-simple-card-view';
import RNFetchBlob from 'react-native-fetch-blob';
import {v4 as uuidv4} from 'uuid';
const Blob = RNFetchBlob.polyfill.Blob;
const fs = RNFetchBlob.fs;
window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest;
window.Blob = Blob;

export default class HomePage extends React.Component {
  options = {
    title: 'Choisir une image',
    takePhotoButtonTitle: 'Prendre une photo',
    chooseFromLibraryButtonTitle: 'Choisir depuis mon téléphone',
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
    imageUri: '',
    counters: [
      {
        title: 'Default',
        logo: 'logo-youtube',
        count: 0,
        id: '0',
      },
    ],
    editPopovers: [
      {
        visible: false,
        input: '',
      },
    ],
    editText: '',
    // modalVisible: [],
  };
  loading = false;
  uploadImage = () => {
    const filename = this.state.userId;
    this.setState({uploading: true});
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
        let state = {};

        state = {
          ...state,
          uploading: false,
          profilePicture: url,
          imageUri: '',
          progress: 0,
        };
        this.setState(state);
      })
      .catch(error => {
        console.log('error', error);
        this.setState({uploading: false});
      });
  };
  pickImage = () => {
    ImagePicker.showImagePicker(this.options, response => {
      if (!response.didCancel) {
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
      }
      console.log('cancelled image picker');
    });
  };
  removeProfilePicture = () => {
    // console.log('pop');
    if (this.state.profilePicture) {
      firebase
        .storage()
        .refFromURL(this.state.profilePicture)
        .delete()
        .then(afterDelete => {
          let state = {
            ...this.state,
            profilePicture: null,
          };
          this.setState(state);
        });
    }
  };

  async componentDidMount(): void {
    let obj = await Storage.getItem('state');
    this.setState({...obj});

    if (!this.state.counters || !this.state.counters[0]) {
      this.initCounters();
    }
    await this.updateCurrentUser();
    let images;
    let path = 'images/' + this.state.userId;
    const storageRef = firebase.storage().ref(path);
    let downloadUrl;
    if (storageRef) {
      downloadUrl = await storageRef
        .getDownloadURL()
        .catch(e => console.log('No images for user', this.state.userId));
      if (downloadUrl) {
        AsyncStorage.getItem('images')
          .then(data => {
            console.log('getImages', data);
            images = JSON.parse(data) || [];
            this.setState({
              ...this.state,
              images: images,
              profilePicture: downloadUrl,
            });
            console.log('profile', this.state.profilePicture);
          })
          .catch(error => {
            console.log(error);
          });
      }
    }

    this.loading = false;

    /*let url = await firebase
      .storage()
      .ref(path)
      .getDownloadURL();*/
  }

  constructor(props) {
    super(props);
    this.onChangeCount = this.onChangeCount.bind(this);
    this.state = {
      counters: [],
      email: '',
      displayName: '',
      images: [],
    };
    // this.populateMockCounters();
  }

  addNewCounter(index, logo, title) {
    let newCounter = {
      id: index.toString(),
      logo: logo,
      title: title,
      count: 0,
    };
    this.state.counters.push(newCounter);
    const newCounters = this.state.counters;
    this.setState(newCounters);
  }

  initCounters() {
    this.setState({counters: []});
    this.state.editPopovers = [];
    let newPopoverState = {
      input: '',
      visible: false,
    };
    for (let i = 0; i < 10; i++) {
      this.state.editPopovers.push(newPopoverState);
      let newPopovers = this.state.editPopovers;
      this.setState({editPopovers: newPopovers});
      this.addNewCounter(i, 'ios-beer', 'Compteur ' + (i + 1).toString());
    }
  }
  async editCounter(counterIndex) {
    // this.setModalVisible(true);
    this.state.counters[counterIndex].title = 'édité ' + counterIndex;
    let newCounters = this.state.counters;
    await this.setState({counters: newCounters});
    await Storage.setItem('state', this.state);
  }
  async resetCounter(counterIndex) {
    this.state.counters[counterIndex].count = 0;
    let newCounters = this.state.counters;
    await this.setState({counters: newCounters});
    await Storage.setItem('state', this.state);
  }
  async onChangeCount(counterIndex) {
    let newCount = this.state.counters[counterIndex].count + 1;
    this.state.counters[counterIndex].count = newCount;
    let newCounters = this.state.counters;
    await this.setState({counters: newCounters});
    await Storage.setItem('state', this.state);
  }

  updateCurrentUser(): void {
    const {email, displayName} = firebase.auth().currentUser;
    const userId = firebase.auth().currentUser.uid;
    console.log('userInfos', userId, email, displayName);
    this.setState({
      ...this.state,
      userId: userId,
      email: email,
      displayName: displayName,
    });
  }

  async signOutUser() {
    firebase
      .auth()
      .signOut()
      .then(value => {
        console.log('signed out');
        let state = {
          ...this.state,
          userId: null,
          email: null,
          displayName: null,
          profilePicture: null,
        };
        this.setState(state);
        console.log('new state', this.state);
      });
  }

  async componentWillUnmount(): void {
    console.log('AsyncStorage SET for "${key}": "${value}"');
    await Storage.setItem('state', this.state);
  }

  showEditPopover(counterIndex) {
    this.setState({editText: this.state.counters[counterIndex].title});

    this.state.editPopovers[counterIndex] = {
      visible: true,
      input: '',
    };
    let newPopovers = this.state.editPopovers;
    this.setState({editPopovers: newPopovers});
  }
  async closeEditPopover(counterIndex) {
    console.log('closing w edit', this.state.editText);
    this.state.editPopovers[counterIndex] = {
      input: this.state.editText,
      visible: false,
    };
    this.state.counters[counterIndex].title = this.state.editText;
    let newCounters = this.state.counters;
    await this.setState({counters: newCounters});
    let newPopovers = this.state.editPopovers;
    await this.setState({editPopovers: newPopovers});
    await Storage.setItem('state', this.state);
  }

  CustomCounter = ({counterStyle, counterIndex}) => {
    return (
      <CardViewWithIcon
        withBackground={false}
        androidIcon={this.state.counters[counterIndex].logo}
        iosIcon={this.state.counters[counterIndex].logo}
        iconHeight={30}
        iconColor={'#333'}
        title={this.state.counters[counterIndex].title}
        contentFontSize={20}
        titleFontSize={12}
        style={counterStyle}
        content={this.state.counters[counterIndex].count.toString()}
        onPress={() => this.onChangeCount(counterIndex)}
      />
    );
  };

  CounterList = ({itemList, counterStyle}) => {
    return (
      <View>
        <FlatList
          data={itemList}
          renderItem={({counter, index}) => (
            <View style={styles.counterRow}>
              <View style={styles.buttonCol}>
                <TouchableOpacity
                  style={styles.reloadButton}
                  onPress={() => this.resetCounter(index)}>
                  <Text style={styles.reloadText}>Remettre à zéro</Text>
                </TouchableOpacity>
              </View>
              <this.CustomCounter
                counterStyle={counterStyle}
                counterIndex={index}
              />
              <View style={styles.buttonCol}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => this.showEditPopover(index)}>
                  <Text style={styles.reloadText}>Editer</Text>
                </TouchableOpacity>
              </View>
              <Popover
                isVisible={this.state.editPopovers[index].visible}
                children={
                  <View style={styles.editCounterPopover}>
                    <View style={styles.editCounterTitleRow}>
                      <Text>Editez le compteur n° {index + 1}</Text>
                    </View>
                    <View style={styles.editCounterInputRow}>
                      <Text style={styles.popoverEditTitle}>
                        Titre du compteur
                      </Text>
                      <TextInput
                        style={styles.popoverEditInput}
                        autoFocus="true"
                        autoCapitalize="none"
                        onChangeText={text => this.setState({editText: text})}
                        value={this.state.editText}
                      />
                    </View>
                    <View style={styles.editCounterButtonRow}>
                      <TouchableOpacity
                        style={styles.popoverEditButton}
                        onPress={() => this.closeEditPopover(index)}>
                        <Text style={styles.whiteText}>Editer le compteur</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                }
              />
            </View>
          )}
          keyExtractor={counter => counter.id}
        />
      </View>
    );
  };

  render() {
    const {uploading, profilePicture, progress, images} = this.state;
    const windowWidth = Dimensions.get('window').width;

    const disabledStyle = uploading ? styles.disabledBtn : {};
    const editButtonStyles = [styles.buttonEdit, disabledStyle];
    const deleteButtonStyles = [styles.buttonDelete, disabledStyle];

    const miniCardStyle = {
      shadowColor: '#000000',
      shadowOffsetWidth: 2,
      shadowOffsetHeight: 2,
      shadowOpacity: 0.1,
      shadowRadius: 5,
      bgColor: '#ffffff',
      padding: 5,
      margin: 5,
      borderRadius: 3,
      elevation: 3,
      width: Dimensions.get('window').width / 2 - 10,
    };
    return (
      <View style={styles.container}>
        {!profilePicture && (
          <View style={styles.imageRow}>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderLabel}>
                Sélectionnez une photo de profil pour la voir apparaître ici
              </Text>
            </View>
          </View>
        )}
        {profilePicture && (
          <View style={styles.imageRow}>
            <Image
              source={{uri: profilePicture.toString()}}
              style={styles.image}
            />
          </View>
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={deleteButtonStyles}
            onPress={() => this.removeProfilePicture()}
            disabled={uploading}>
            <View>
              <Text style={styles.btnTxt}>Supprimer la photo de profil</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>
              LifeCounter {this.state.displayName}
            </Text>
          </View>
          <TouchableOpacity
            style={editButtonStyles}
            onPress={this.pickImage}
            disabled={uploading}>
            <View>
              <Text style={styles.btnTxt}>Choisir une photo de profil</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingBottom: 55,
            maxHeight: '65%',
            // maxHeight: '55%',
          }}>
          <this.CounterList
            itemList={this.state.counters}
            counterStyle={miniCardStyle}
          />
        </View>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => this.signOutUser()}>
          <Text style={styles.signOutButtonText}>Deconnexion</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 2,
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    height: '100%',
    // paddingTop: 25,
  },
  title: {
    fontSize: 20,
    width: 100,
    fontWeight: '500',
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    // justifyItems: 'space-between',
    justifyContent: 'space-between',
  },
  welcomeCard: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 4,
    width: '35%',
    backgroundColor: '#E9446A',
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  buttonEdit: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 4,
    width: '30%',
    backgroundColor: 'rgb(3, 154, 229)',
    marginTop: 20,
    alignItems: 'center',
  },
  buttonDelete: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 4,
    backgroundColor: 'red',
    width: '30%',
    marginTop: 20,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: 'rgba(3,155,229,0.5)',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 17,
    textAlign: 'center',
  },
  btnTxt: {
    color: '#fff',
  },
  signOutButton: {
    position: 'absolute',
    bottom: 0,
    width: '50%',
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 16,
    padding: 5,
    borderRadius: 5,
    backgroundColor: 'red',
    // borderWidth: 1,
  },
  signOutButtonText: {
    color: '#FFF',
    textAlign: 'center',
  },
  imageRow: {
    flexDirection: 'column',
    height: '25%',
    // justifyContent: 'center',
    width: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#8a8a8a',
    flexDirection: 'column',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  imagePlaceholderLabel: {
    color: '#FFF',
    textAlign: 'center',
  },
  image: {
    // marginTop: 20,
    width: '100%',
    height: '100%',
    borderRadius: 5,
    // overflow: 'hidden',
    resizeMode: 'cover',
    backgroundColor: 'transparent',
  },
  counterRow: {
    flexDirection: 'row',
    width: '100%',
  },
  buttonCol: {
    flexDirection: 'column',
    width: '25%',
    height: 40,
    justifyContent: 'center',
    paddingTop: 50,
    paddingLeft: 10,
  },
  reloadButton: {
    width: '80%',
    height: 40,
    backgroundColor: 'rgb(107, 107, 107)',
    borderRadius: 5,
    justifyContent: 'center',
  },
  editButton: {
    width: '80%',
    height: 40,
    backgroundColor: 'rgb(191, 125, 44)',
    borderRadius: 5,
    justifyContent: 'center',
  },
  reloadText: {
    padding: 1,
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
  },
  editCounterPopover: {
    flexDirection: 'column',
    height: 300,
    width: 300,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  editCounterTitleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  editCounterInputRow: {
    // flexDirection: 'row',
    padding: 15,
    justifyContent: 'center',
    width: '100%',
  },
  editCounterButtonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  popoverEditTitle: {
    color: '#8A8F9E',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  popoverEditInput: {
    //width: '90%',
    borderBottomColor: '#8A8F9E',
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 40,
    fontSize: 15,
    color: '#161F3D',
  },
  popoverEditButton: {
    // marginHorizontal: 30,
    backgroundColor: '#E9446A',
    borderRadius: 4,
    height: 52,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteText: {
    color: '#FFF',
  },
});

const Storage = {
  getItem: async function(key) {
    let item = await AsyncStorage.getItem(key);
    //You'd want to error check for failed JSON parsing...
    return JSON.parse(item);
  },
  setItem: async function(key, value) {
    return await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: async function(key) {
    return await AsyncStorage.removeItem(key);
  },
};
