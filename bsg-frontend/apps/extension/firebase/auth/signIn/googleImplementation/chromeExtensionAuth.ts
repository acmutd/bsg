import { getFirebaseAuth } from "../../../config";
import { signInWithCredential, GoogleAuthProvider, User } from "firebase/auth";

export async function SignInWithChromeIdentity(): Promise<User> {
  return new Promise((resolve, reject) => {
    if (!chrome.identity) {
      reject(new Error('Chrome identity API not available'));
      return;
    }

    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!token || typeof token !== 'string') {
        reject(new Error('No valid token received'));
        return;
      }

      try {
        // get auth lazily (may be null during server/build)
        const auth = getFirebaseAuth();
        if (!auth) {
          reject(new Error('Firebase auth not available in this environment'));
          return;
        }

        // Create a Firebase credential using the token
        const credential = GoogleAuthProvider.credential(null, token);

        // Sign in to Firebase with the credential
        const result = await signInWithCredential(auth, credential);

        resolve(result.user);
      } catch (error) {
        console.error('Firebase auth error:', error);
        reject(error);
      }
    });
  });
}

export async function getUserInfoFromToken(token: string) {
  const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);
  if (!response.ok) {
    throw new Error('Failed to get user info');
  }
  return response.json();
}

export async function SignOutFromChrome(): Promise<void> {

  return new Promise((resolve, reject) => {
    if (!chrome.identity) {
      reject(new Error('Chrome identity API not available'));
      return;
    }

    chrome.identity.getAuthToken({ interactive: false }, (token) => {

      const tokenToRevoke = token.toString();
      const requestBody = new URLSearchParams({ token: tokenToRevoke }).toString();
      
      fetch('https://oauth2.googleapis.com/revoke', {
        method:'POST',
        headers:{
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,

      }).then(response =>{
        if(response.ok){
          console.log("Reached google servers")

          chrome.identity.clearAllCachedAuthTokens(async () => {
            const auth = getFirebaseAuth();
            if (auth) {
              try {
                await auth.signOut();
              } catch (e) {
                // ignore sign out error
              }
            }
            resolve();
          });
                
        }
        else {
          console.error('Error revoking token', response.status, response.statusText)
          reject(new Error(`Failed to revoke token: ${response.statusText}`))
        }
      }
      ).catch(error => {
        console.error("Network Error during token revocation", error)
        reject(error);
      })


    });


  });


}