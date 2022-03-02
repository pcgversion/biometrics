/**
 * Sample Biometric Keypair and Signature generation Test
 *
 * Steve Nguyen
 */

import React from 'react';
import type { Node } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button
} from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';
import ReactNativeBiometrics from 'react-native-biometrics';
import DeviceInfo from 'react-native-device-info';
import { useEffect, useState, useLayoutEffect } from 'react';
import base64 from 'react-native-base64';
import { RSAKeychain } from 'react-native-rsa-native';


const App: () => Node = () => {
  const deviceId = DeviceInfo.getDeviceId();
  const deviceUniqueId = DeviceInfo.getUniqueId();
  const deviceType = DeviceInfo.getDeviceType();
  const [supportsBiometrix, setSupportsBiometrix] = useState(false);
  const [biometrixType, setBiometrixType] = useState('');
  const [biometrixMessage, setBiometrixMessage] = useState('');
  const [biometrixKey, setBiometrixKey] = useState('');
  const [biometrixSignatureMessage, setBiometrixSignatureMessage] = useState('');
  const [biometrixTypeMessage, setBiometrixTypeMessage] = useState('This device does not have Biometrics enabled');
  const [payloadMessage, setPayloadMessage] = useState('');
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter, flex: 1, padding: 20, flexDirection: 'row', width: '100%',
  };

  useEffect(() => {
    checkBiometrixType();
  }, [biometrixMessage]);

  //Produces public key to be used
  const saveBiometricDetails = async () => {
    const { biometryType } = await ReactNativeBiometrics.isSensorAvailable();
    if (biometryType) {
      try {
        const { keysExist } = await ReactNativeBiometrics.biometricKeysExist();
        if (keysExist) {
          await ReactNativeBiometrics.deleteKeys();
        }
        const { publicKey } = await ReactNativeBiometrics.createKeys('Confirm biometrics');
        const payload = {
          deviceId: deviceId,
          deviceType: deviceType,
          publicKey: publicKey,
        };
        setBiometrixKey(publicKey);

      } catch (error) {
        setBiometrixKey('Error on saveBiometricDetails:', error);
      }
    } else {
      setBiometrixMessage('No Biometric Type');
    }
  };


  const checkBiometrixType = async () => {
    const { biometryType } = await ReactNativeBiometrics.isSensorAvailable();
    if (biometryType) {
      setSupportsBiometrix(true);
      if (biometryType === ReactNativeBiometrics.TouchID) {
        setBiometrixType('Has Touch ID');
        setBiometrixTypeMessage('This device has Touch ID');
      } else if (biometryType === ReactNativeBiometrics.FaceID) {
        setBiometrixType('Has Face ID');
        setBiometrixTypeMessage('This device has Face ID');
      } else if (biometryType === ReactNativeBiometrics.Biometrics) {
        setBiometrixType('Has Face ID/Touch ID');
        setBiometrixTypeMessage('This device has Face ID/Touch ID');
      }
    } else {
      setSupportsBiometrix(false);
    }
  };

  const checkBiometrix = async () => {

    checkBiometrixType();
    if (supportsBiometrix == true) {
      const { biometryType } = await ReactNativeBiometrics.isSensorAvailable();
      if (biometryType) {
        try {
          saveBiometricDetails();
          let payload = deviceUniqueId;
          await ReactNativeBiometrics.createSignature({
            promptMessage: 'Sign In',
            payload,
          })
            .then(async (result) => {
              const { success, signature } = result;
              if (success) {
                const biometricCred = {
                  deviceId: deviceId,
                  payload: payload,
                  signature: signature
                };
                setBiometrixSignatureMessage(signature);
                if (await RSAKeychain.verify(base64.decode(signature), payload, base64.decode(biometrixKey))) {
                  // The signature matches: trust this message.
                  setBiometrixMessage('VALID! The generated signature & key was matched for the given payload.');
                  setPayloadMessage(deviceUniqueId);
                } else {
                  // The signature does not match.
                  setBiometrixMessage('INVALID!!!!');
                }
              } else {
                setBiometrixMessage('Could not create signature');
              }
            })
            .catch((err) => {
              console.log('Error on CreateSignature:', base64.decode(biometrixKey), err);
              setBiometrixMessage('INVALID - ' + err);
            });
        } catch (error) {
          console.log('Error on checkBiometrix:', error);
        }
      }
    }
  };



  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: '#ffffff'}}>
        <View style={styles.resultViewHeader}>
          <Text selectable={true} selectionColor='#dcdcdc' style={{ textAlign: 'center', width: '100%', fontSize: 16 }}>{deviceUniqueId}</Text>
          <Text style={{ textAlign: 'center', width: '100%', fontSize: 24 }}>{biometrixTypeMessage}</Text>
        </View>
        <View style={styles.resultViewWrapper}>
          {biometrixKey !== '' &&
            <>
              <Text style={styles.resultLabelText}>Public Key</Text>
              <Text style={styles.resultText} selectable={true} selectionColor='#ffff00' >{biometrixKey}</Text>
            </>
          }
        </View>
        <View style={styles.resultViewWrapper}>
          {biometrixSignatureMessage !== '' &&
            <>
              <Text style={styles.resultLabelText}>Signature</Text>
              <Text style={styles.resultText} selectable={true} selectionColor='#ffff00'>{biometrixSignatureMessage}</Text>
            </>
          }
        </View>
        <View style={styles.resultViewWrapper}>
          {payloadMessage !== '' &&
            <>
              <Text style={styles.resultLabelText}>Payload</Text>
              <Text style={styles.resultBiggerText} selectable={true} selectionColor='#ffff00'>{payloadMessage}</Text>
            </>
          }
        </View>
        <View style={styles.resultViewWrapper}>
          {biometrixMessage !== '' &&
            <>
              <Text style={styles.resultLabelText}>Result</Text>
              <Text style={styles.resultBiggerText} selectable={true} selectionColor='#ffff00'>{biometrixMessage}</Text>
            </>
          }
        </View>
        <View style={styles.btnViewWrapper}>
          <View style={styles.btnView}>
            <Button
              title="Enable Biometrics"
              color="#ffffff"
              onPress={checkBiometrix}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  resultViewHeader: {
    flex: 1,
    flexDirection: 'column',
    marginTop: 0,
    padding: 20,
    width: '100%',
    backgroundColor: '#65ad57',
    borderWidth: 1,
    borderColor: '#295321',
  },
  resultViewWrapper: {
    flex: 1,
    flexDirection: 'column',
    marginTop: 0,
    padding: 20,
    width: '100%',
  },
  resultLabelText: {
    marginTop: 0,
    width: '100%',
    textAlign: 'center',
    fontWeight: '800',
  },
  resultText: {
    marginTop: 10,
    textAlign: 'center',
    width: '100%',
    fontSize: 14,
    flexWrap: 'nowrap',
  },
  resultBiggerText: {
    marginTop: 10,
    textAlign: 'center',
    width: '100%',
    fontSize: 18,
    flexWrap: 'nowrap',
  },
  btnViewWrapper: {
    height: '50%',
    flex: 1,
    flexDirection: 'row',
    marginBottom: 50,
    justifyContent: 'center',
    alignContent: 'center',
    borderRadius: 8,
    marginTop: 20,
  },
  btnView: {
    backgroundColor: '#0074cc',
    borderWidth: 1,
    borderColor: '#0b62a5',
    borderRadius: 8,
    padding: 8,
  },
});

export default App;
