import React, {useState, useEffect} from 'react';
import fb from '../firebase';
import {GeoFirestore} from 'geofirestore';
import {getLatLng, geocodeByAddress} from 'react-places-autocomplete';
import Entry from './Entry';
import LocationInput from './LocationInput';
import withFirebaseAuth from "react-with-firebase-auth";
import * as firebaseApp from "firebase/app";
import 'firebase/auth';
import CloseIcon from '@material-ui/icons/Close';
const firebaseAppAuth = firebaseApp.auth();

const NotifyMe = (props) => {

  const {location} = props;

  const [email, setEmail] = useState('');
  const [signInLinkSent, setSignInLinkSent] = useState(false);

  const handleClick = async () => {
    window.localStorage.setItem('emailForSignIn', email);

    try {
      await firebaseApp.auth().sendSignInLinkToEmail(email, {
        url: 'http://localhost:3000/#/complete-offer-help?location=' + location,
        handleCodeInApp: true,
      });

      setSignInLinkSent(true);

    } catch (error) {
      // TODO: handle error
    }
  };

  if (signInLinkSent) {
    return (
      <div className="border bg-secondary px-4 py-2 rounded text-white flex flex-row items-center">
        Wir haben dir eine Email gesendet! Bitte überprüfe dein Postfach und klicke auf den Link in unserer Email! Wir
        werden dich dann benachrichtigen, wenn Leute in {location} Hilfe benötigen.
        <CloseIcon />
      </div>
    )
  } else {
    return (
      <div>
        <div className="mb-2 mt-4">In <span className="text-secondary">{location}</span> gibt es aktuell keine Anfragen. Du kannst von uns automatisch
          benachrichtigt werden wenn
          jemand in deiner Nähe Hilfe braucht.
        </div>
        <input className="px-2 py-2 w-full rounded border-2" type="email" placeholder="Deine Emailadresse"
               onChange={(e) => setEmail(e.target.value)} value={email} required="required"></input>
        <button style={{color: 'white'}} className="mt-4 mb-16 btn text-white btn-primary bg-primary"
                onClick={handleClick}>
          Benachrichtigen, wenn jemand in meiner Nähe Hilfe braucht
        </button>
      </div>
    );
  }
};

export default function FilteredList() {

  const [location, setLocation] = useState('');
  const [entries, setEntries] = useState([{
    id: "placeholder-id"
  }]);
  const [searchCompleted, setSearchCompleted] = useState(false);

  const collection = fb.store.collection('ask-for-help');
  const query = collection.orderBy('d.timestamp', 'desc').limit(10);

  const getUserData = () => {
    query.get().then(value => {
      setEntries(value.docs.map(doc => ({...doc.data().d, id: doc.id})));
    });
  };

  useEffect(getUserData, []);

  // Create a Firestore reference
  const geofirestore = new GeoFirestore(fb.store);

// Create a GeoCollection reference
  const geocollection = geofirestore.collection('ask-for-help');

  const handleSelect = address => {
    setLocation(address);
    geocodeByAddress(address)
      .then(results => getLatLng(results[0]))
      .then(coordinates => {
        const query = geocollection.near({
          center: new fb.app.firestore.GeoPoint(coordinates.lat, coordinates.lng),
          radius: 30
        });
        query.get().then((value) => {
          // All GeoDocument returned by GeoQuery, like the GeoDocument added above
          console.log(value.docs)
          setEntries(value.docs.map(doc => ({...doc.data(), id: doc.id})));
          setSearchCompleted(true);
        });
      })
      .catch(error => console.error('Error', error));
  };

  return (<div>
      <div className="py-3">
        <LocationInput onChange={setLocation} value={location} onSelect={handleSelect}/>
      </div>
      <div className="py-3 w-full">
        {/*<NotifyMe location="Hof, Germany" />*/}
        {entries.length === 0 ? (!searchCompleted || location.length === 0 ?
          <span>Bitte gib deinen Standort ein.</span> : <NotifyMe location={location}/>) : entries.map(entry => (
          <Entry key={entry.id} {...entry}/>))}
      </div>
    </div>
  );
}

