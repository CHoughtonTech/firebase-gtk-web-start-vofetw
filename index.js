// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required
import { initializeApp, firebase } from 'firebase/app';

// Add the Firebase products and methods that you want to use
import {
  getAuth,
  EmailAuthProvider,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
} from 'firebase/auth';

import {
  getFirestore,
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  getDocs,
  where,
} from 'firebase/firestore';

import { getDatabase, get, child, ref, set } from 'firebase/database';

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');
const getDocsButton = document.getElementById('get-docs-button');

let rsvpListener = null;
let guestbookListener = null;

let db, auth, dbr, dbs;

function subscribeGuestbook() {
  // Create query for messages
  const q = query(collection(db, 'guestbook'), orderBy('timestamp', 'desc'));
  onSnapshot(q, (snaps) => {
    // Reset page
    guestbook.innerHTML = '';
    // Loop through documents in database
    snaps.forEach((doc) => {
      // Create an HTML entry for each document and add it to the chat
      const entry = document.createElement('p');
      entry.textContent = doc.data().name + ': ' + doc.data().text;
      guestbook.appendChild(entry);
    });
  });
}

function unsubscribeGuestbook() {
  if (guestbookListener != null) {
    guestbookListener();
    guestbookListener = null;
  }
}

// Listen for attendee list
function subscribeCurrentRSVP(user) {
  const ref = doc(db, 'attendees', user.uid);
  rsvpListener = onSnapshot(ref, (doc) => {
    if (doc && doc.data()) {
      const attendingResponse = doc.data().attending;

      // Update css classes for buttons
      if (attendingResponse) {
        rsvpYes.className = 'clicked';
        rsvpNo.className = '';
      } else {
        rsvpYes.className = '';
        rsvpNo.className = 'clicked';
      }
    }
  });
}

function unsubscribeCurrentRSVP() {
  if (rsvpListener != null) {
    rsvpListener();
    rsvpListener = null;
  }
  rsvpYes.className = '';
  rsvpNo.className = '';
}

async function main() {
  // Add Firebase project configuration object here
  const firebaseConfig = {
    apiKey: 'AIzaSyCek4Vhh2Jkepb9BZNqUhI4dSzy4PbClJw',
    authDomain: 'fir-web-codelab-7da1d.firebaseapp.com',
    databaseURL: 'https://fir-web-codelab-7da1d-default-rtdb.firebaseio.com',
    projectId: 'fir-web-codelab-7da1d',
    storageBucket: 'fir-web-codelab-7da1d.appspot.com',
    messagingSenderId: '925919244284',
    appId: '1:925919244284:web:902112ba983ccf3e9e8c79',
  };

  const incomeData = {
    id: 3429527,
    name: 'Vivint Inc',
    type: 's',
    salary: 110313,
    netSalary: 50274.17,
    hourlyRate: 0,
    hoursPerWeek: 0,
    employmentType: 'ft',
    filingStatus: 'm',
    payPeriod: 26,
    state: 'UT',
    isActive: true,
    deductions: [
      {
        name: '401K',
        amount: 127.29,
        type: 'pretax',
      },
      {
        name: 'Dental',
        amount: 24.33,
        type: 'pretax',
      },
      {
        name: 'Medical',
        amount: 192.8,
        type: 'pretax',
      },
      {
        name: 'Vision',
        amount: 12.32,
        type: 'pretax',
      },
      {
        name: 'Critical Illness',
        amount: 11.13,
        type: 'posttax',
      },
      {
        name: 'Support(C001333342)',
        amount: 290.31,
        type: 'posttax',
      },
      {
        id: 0,
        name: 'HSA',
        amount: 19.23,
        type: 'pretax',
      },
      {
        name: 'Trey Venmo',
        amount: 130,
        type: 'posttax',
      },
      {
        name: 'Support (C001336540)',
        amount: 163.85,
        type: 'posttax',
      },
    ],
  };

  // Make sure Firebase is initilized
  try {
    if (firebaseConfig && firebaseConfig.apiKey) {
      initializeApp(firebaseConfig);
    }
    db = getFirestore();
    dbr = ref(getDatabase());
    dbs = getDatabase();
    auth = getAuth();
    get(child(dbr, 'bills')).then((snapshot) => {
      console.log(snapshot.val());
    });
    set(ref(dbs, 'income'), [incomeData]);
    get(child(dbr, 'income')).then((result) => {
      console.log('realtime db result', result.val());
    });
  } catch (e) {
    console.log('error:', e);
    document.getElementById('app').innerHTML =
      '<h1>Welcome to the Codelab! Add your Firebase config object to <pre>/index.js</pre> and refresh to get started</h1>';
    throw new Error(
      'Welcome to the Codelab! Add your Firebase config object from the Firebase Console to `/index.js` and refresh to get started'
    );
  }

  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      EmailAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      },
    },
  };

  const ui = new firebaseui.auth.AuthUI(getAuth());
  // Listen to RSVP button clicks
  startRsvpButton.addEventListener('click', () => {
    if (auth.currentUser) {
      // User is signed in; allows user to sign out
      signOut(auth);
    } else {
      // No user is signed in; allows user to sign in
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  });

  // Listen to the current Auth state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      startRsvpButton.textContent = 'LOGOUT';
      // Show guestbook to logged-in users
      guestbookContainer.style.display = 'block';
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        // sendEmailVerification(auth.currentUser)
        //   .then(() => {
        //     console.log('Email Verification Sent!');
        //   })
        //   .catch((e) => {
        //     console.log('Error: ', e);
        //   });
        console.log(auth.currentUser.displayName, 'has NOT verified email!');
      } else {
        console.log(auth.currentUser.displayName, 'has verified email!');
      }
      // Subscribe to the guestbook collection
      subscribeGuestbook();
      // Subscribe to the user's RSVP
      subscribeCurrentRSVP();
    } else {
      startRsvpButton.textContent = 'RSVP';
      // Hide guestbook for non-logged-in users
      guestbookContainer.style.display = 'none';
      // Unsubscribe from the guestbook collection
      unsubscribeGuestbook();
      // Unsubscribe from the user's RSVP
      unsubscribeCurrentRSVP();
    }
  });

  // Listen to the form submission
  form.addEventListener('submit', async (e) => {
    // Prevent the default form redirect
    e.preventDefault();
    // Write a new message to the database collection "guestbook"
    addDoc(collection(db, 'guestbook'), {
      text: input.value,
      timestamp: Date.now(),
      name: auth.currentUser.displayName,
      userId: auth.currentUser.uid,
    });
    // clear message input field
    input.value = '';
    // Return false to avoid redirect
    return false;
  });

  // Listen to RSVP responses
  rsvpYes.onclick = async () => {
    // Get a reference to the user's document in the attendees collection
    const userRef = doc(db, 'attendees', auth.currentUser.uid);

    // If they RSVP'd yes, save a document with attending: true
    try {
      await setDoc(userRef, {
        attending: true,
      });
    } catch (e) {
      console.error(e);
    }
  };
  rsvpNo.onclick = async () => {
    // Get a reference to the user's document in the attendees collection
    const userRef = doc(db, 'attendees', auth.currentUser.uid);

    // If they RSVP'd no, save a document with attending: no
    try {
      await setDoc(userRef, {
        attending: false,
      });
    } catch (e) {
      console.error(e);
    }
  };

  getDocsButton.onclick = async () => {
    try {
      const userRef = doc(db, 'income', auth.currentUser.uid);
      set(ref(dbs, `income/${auth.currentUser.uid}`), {data: [incomeData]});
      setDoc(userRef, { data: [incomeData] });
      getDoc(userRef).then((result) => {
        console.log('getdoc result', result.data());
      });
      const q = query(
        collection(db, 'income')
      );
      const docsButtonDocs = await getDocs(q);
      docsButtonDocs.forEach((snappyDoc) => {
        console.log('snappy doc', snappyDoc.data());
      });
    } catch (e) {
      console.log('getDocsButton-Error', e);
    }
  };

  // Listen for attendee list
  // Listen for attendee list
  const attendingQuery = query(
    collection(db, 'attendees'),
    where('attending', '==', true)
  );
  const unsubscribe = onSnapshot(attendingQuery, (snap) => {
    const newAttendeeCount = snap.docs.length;
    numberAttending.innerHTML = newAttendeeCount + ' people going';
  });
}
main();
