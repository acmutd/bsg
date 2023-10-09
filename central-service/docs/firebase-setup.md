# Firebase Setup Guide

For authentication, BSG will be using Firebase as it supports various login method out of the box. Following is a guide on how to setup your own Firebase app instance for development. 

## Setup guide

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project
2. Go to Project Settings of newly-created project and choose Service accounts
3. Click **Generate new private key**, which will prompt you to download a JSON file. 
4. Save the JSON file at root folder of `central-service` and make sure to name the JSON file `serviceKey.json`.

## Generate Auth Token for API mock calls

1. From Firebase Console of your app, go to Authentication. 
2. Go to Users, click Add user, and fill out necessary information. 
3. Interact with Firebase App to login using created credentials. One way to do this is to create a mock frontend React app that will allows one to interact with Firebase App as follow: 
```js
const userEmail = /* email of newly created user */
const userPassword = /* password of newly created user */
const appConfig = /* app config object goes here */;
initializeApp(appConfig);
const auth = getAuth();
signInWithEmailAndPassword(auth, userEmail, userPassword).then(async (value) => {
  const token = await value.user.getIdToken();
  console.log(token); // this allows us to view token in browser console log
});
```
4. Include the token in the `Authorization` field of every request headers, which should allow one to be able to authorize oneself. 