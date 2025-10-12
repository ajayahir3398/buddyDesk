# React Native Deep Linking Setup for Password Reset

## Overview
This guide explains how to set up deep linking in your React Native app to handle password reset links from emails.

## Deep Link Format
Password reset emails will contain a deep link in this format:
```
buddydesk://reset-password?token=a8ec2f3a5597ea75ec90f54618d6157cff5a7083882dbf4091e462cbd1306c66
```

## Step 1: Configure Environment Variable

Add to your `.env` file:
```env
# React Native Deep Link Scheme
APP_SCHEME=buddydesk
```

**Note:** Replace `buddydesk` with your actual app scheme.

## Step 2: Configure React Native App

### For iOS (iOS/Info.plist)

Add the URL scheme to your `Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLName</key>
    <string>com.yourcompany.buddydesk</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>buddydesk</string>
    </array>
  </dict>
</array>
```

### For Android (android/app/src/main/AndroidManifest.xml)

Add the intent filter to your main activity:

```xml
<activity
  android:name=".MainActivity"
  android:label="@string/app_name">
  
  <intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
  </intent-filter>
  
  <!-- Deep Link Configuration -->
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="buddydesk" />
  </intent-filter>
  
</activity>
```

## Step 3: Install React Navigation Deep Linking (if using React Navigation)

```bash
npm install @react-navigation/native
```

### Configure Deep Linking in App.js

```javascript
import { NavigationContainer } from '@react-navigation/native';
import { Linking } from 'react-native';

const linking = {
  prefixes: ['buddydesk://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

function App() {
  return (
    <NavigationContainer linking={linking}>
      {/* Your navigation stack */}
    </NavigationContainer>
  );
}
```

## Step 4: Create Reset Password Screen

```javascript
// screens/ResetPasswordScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';

const ResetPasswordScreen = () => {
  const route = useRoute();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get token from deep link URL params
    if (route.params?.token) {
      setToken(route.params.token);
    }
  }, [route.params]);

  const handleResetPassword = async () => {
    if (!token) {
      Alert.alert('Error', 'Invalid reset token');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'http://your-api-url.com/api/user/reset-password',
        {
          token: token,
          new_password: newPassword,
        }
      );

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Password reset successfully! Please login with your new password.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to reset password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Reset Password
      </Text>

      {token ? (
        <View>
          <Text style={{ marginBottom: 10 }}>
            Enter your new password:
          </Text>
          
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              marginBottom: 20,
              borderRadius: 5,
            }}
            placeholder="New Password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
          />

          <Button
            title={loading ? 'Resetting...' : 'Reset Password'}
            onPress={handleResetPassword}
            disabled={loading}
          />
        </View>
      ) : (
        <View>
          <Text style={{ color: 'red', marginBottom: 10 }}>
            No reset token found. Please use the link from your email.
          </Text>
          
          <Text style={{ marginBottom: 10 }}>
            Or enter your reset token manually:
          </Text>
          
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              marginBottom: 20,
              borderRadius: 5,
            }}
            placeholder="Reset Token"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
          />
          
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              marginBottom: 20,
              borderRadius: 5,
            }}
            placeholder="New Password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
          />

          <Button
            title={loading ? 'Resetting...' : 'Reset Password'}
            onPress={handleResetPassword}
            disabled={loading || !token}
          />
        </View>
      )}
    </View>
  );
};

export default ResetPasswordScreen;
```

## Step 5: Test Deep Linking

### Test on iOS Simulator
```bash
xcrun simctl openurl booted buddydesk://reset-password?token=test123
```

### Test on Android Emulator
```bash
adb shell am start -W -a android.intent.action.VIEW -d "buddydesk://reset-password?token=test123"
```

### Test on Physical Device
1. Send the password reset email
2. Open email on your phone
3. Tap the "Open App & Reset Password" button
4. App should open to the reset password screen

## Alternative: Manual Token Entry

If deep linking doesn't work, users can:
1. Copy the token from the email
2. Open the app manually
3. Navigate to reset password screen
4. Paste the token
5. Enter new password

The email template includes the token in plain text for this purpose.

## Password Requirements

Make sure your React Native app enforces the same password rules:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

## API Endpoint

The React Native app should call:
```
POST http://your-api-url.com/api/user/reset-password

Body:
{
  "token": "reset_token_from_email",
  "new_password": "NewPassword123!"
}
```

## Troubleshooting

### Deep Link Not Opening App

1. **iOS**: Make sure URL scheme is in Info.plist
2. **Android**: Check intent filter in AndroidManifest.xml
3. **Both**: Rebuild the app after configuration changes

### Token Not Being Captured

1. Check React Navigation linking configuration
2. Verify route.params contains the token
3. Log the URL being opened: `Linking.addEventListener('url', console.log)`

### Testing Without Email

You can test by opening the deep link directly:

**iOS (Simulator)**:
```bash
xcrun simctl openurl booted "buddydesk://reset-password?token=YOUR_TOKEN_HERE"
```

**Android (Emulator)**:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "buddydesk://reset-password?token=YOUR_TOKEN_HERE"
```

## Universal Links (Optional - More Professional)

For a better user experience, consider setting up Universal Links (iOS) / App Links (Android):

### Format
```
https://yourdomain.com/reset-password?token=xxx
```

This allows the same URL to:
- Open the app if installed
- Open a web fallback page if app is not installed

See [Universal Links Guide](https://reactnavigation.org/docs/deep-linking/#universal-links-ios) for setup.

## Summary

1. ✅ Configure `APP_SCHEME` in `.env`
2. ✅ Add URL scheme to iOS Info.plist
3. ✅ Add intent filter to Android AndroidManifest.xml
4. ✅ Set up React Navigation deep linking
5. ✅ Create ResetPassword screen
6. ✅ Handle token from route params
7. ✅ Call API to reset password
8. ✅ Test deep linking on both platforms

---

**Need Help?** Check the [React Navigation Deep Linking Docs](https://reactnavigation.org/docs/deep-linking/)

