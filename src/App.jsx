
import React, { useEffect, useRef, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "./app.css";

import { db, auth } from "./firebase";

import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

/* ================================
   LEAFLET MARKER ICON FIX
================================ */

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ================================
   MAP POSITION UPDATER
================================ */

function MapUpdater({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(
        [position.latitude, position.longitude],
        15
      );
    }
  }, [position, map]);

  return null;
}

/* ================================
   MAIN APP
================================ */

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isRegistering, setIsRegistering] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [position, setPosition] = useState(null);
  const [friendLocation, setFriendLocation] = useState(null);

  const [friendEmail, setFriendEmail] = useState("");

  const [isSharing, setIsSharing] = useState(false);

  const watchId = useRef(null);
  const unsubscribeFriend = useRef(null);

  /* ================================
     AUTHENTICATION LISTENER
  ================================ */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ================================
     STOP LOCATION SHARING
  ================================ */

  const stopLocationSharing = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    setIsSharing(false);
  };

  /* ================================
     STOP TRACKING FRIEND
  ================================ */

  const stopTracking = () => {
    if (unsubscribeFriend.current) {
      unsubscribeFriend.current();
      unsubscribeFriend.current = null;
    }

    setFriendLocation(null);
  };

  /* ================================
     CLEANUP ON UNMOUNT
  ================================ */

  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }

      if (unsubscribeFriend.current) {
        unsubscribeFriend.current();
      }
    };
  }, []);

  /* ================================
     CREATE ACCOUNT
  ================================ */

  const handleRegister = async () => {
    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      alert("Account created successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  /* ================================
     LOGIN
  ================================ */

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
    } catch (error) {
      alert(error.message);
    }
  };

  /* ================================
     LOGOUT
  ================================ */

  const handleLogout = async () => {
    stopLocationSharing();
    stopTracking();

    try {
      await signOut(auth);

      setPosition(null);
      setFriendEmail("");
      setEmail("");
      setPassword("");
    } catch (error) {
      alert(error.message);
    }
  };

  /* ================================
     SHARE LIVE LOCATION
  ================================ */

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    if (!user) {
      alert("Please log in first.");
      return;
    }

    if (watchId.current !== null) {
      return;
    }

    setIsSharing(true);

    watchId.current = navigator.geolocation.watchPosition(
      async (location) => {
        const latitude = location.coords.latitude;
        const longitude = location.coords.longitude;

        const currentPosition = {
          latitude,
          longitude,
        };

        setPosition(currentPosition);

        try {
          await setDoc(
            doc(db, "locations", user.email.toLowerCase()),
            {
              email: user.email.toLowerCase(),
              latitude,
              longitude,
              accuracy: location.coords.accuracy,
              timestamp: serverTimestamp(),
            }
          );
        } catch (error) {
          console.error("Location update error:", error);
          alert("Unable to update your location in Firebase.");
          stopLocationSharing();
        }
      },

      (error) => {
        console.error("Geolocation error:", error);

        alert(
          "Unable to access your location. Please allow location permission."
        );

        stopLocationSharing();
      },

      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  };

  /* ================================
     TRACK FRIEND
  ================================ */

  const trackFriend = () => {
    if (!friendEmail.trim()) {
      alert("Please enter your friend's email address.");
      return;
    }

    if (!user) {
      alert("Please log in first.");
      return;
    }

    const friend = friendEmail.trim().toLowerCase();

    if (friend === user.email.toLowerCase()) {
      alert("You cannot track your own location using this option.");
      return;
    }

    stopTracking();

    const friendRef = doc(db, "locations", friend);

    unsubscribeFriend.current = onSnapshot(
      friendRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();

          setFriendLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            email: data.email,
          });
        } else {
          setFriendLocation(null);
          alert("No location found for this email.");
        }
      },
      (error) => {
        console.error("Tracking error:", error);
        alert("Unable to track this user. Please check your access.");
      }
    );
  };

  /* ================================
     LOADING SCREEN
  ================================ */

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Got_Track</h2>
          <p className="auth-subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  /* ================================
     LOGIN / REGISTER SCREEN
  ================================ */

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Got_Track</h1>

          <p className="auth-subtitle">
            Stay connected. Share your location.
          </p>

          <form onSubmit={(event) => event.preventDefault()}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {isRegistering ? (
              <button
                type="button"
                className="create-account-btn"
                onClick={handleRegister}
              >
                Create Account
              </button>
            ) : (
              <button
                type="button"
                className="login-btn"
                onClick={handleLogin}
              >
                Login
              </button>
            )}
          </form>

          <div className="auth-switch">
            {isRegistering
              ? "Already have an account?"
              : "Don't have an account?"}

            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Login" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================================
     MAIN DASHBOARD
  ================================ */

  const mapPosition = position || friendLocation;

  return (
    <div className="dashboard">
      <header className="top-bar">
        <div>
          <h1 className="app-title">Got_Track</h1>
          <p className="user-email">{user.email}</p>
        </div>

        <div className="header-actions">
          <button
            className="share-btn"
            onClick={getLocation}
            disabled={isSharing}
          >
            {isSharing ? "Sharing Location..." : "Share My Location"}
          </button>

          {isSharing && (
            <button
              className="logout-btn"
              onClick={stopLocationSharing}
            >
              Stop Sharing
            </button>
          )}

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="search-container">
        <input
          type="email"
          placeholder="Enter friend's email to track location"
          value={friendEmail}
          onChange={(event) => setFriendEmail(event.target.value)}
        />

        <button
          className="track-btn"
          onClick={trackFriend}
        >
          Track Friend
        </button>

        {friendLocation && (
          <button
            className="logout-btn"
            onClick={stopTracking}
          >
            Stop Tracking
          </button>
        )}
      </div>

      <div className="map-container">
        {mapPosition ? (
          <MapContainer
            center={[
              mapPosition.latitude,
              mapPosition.longitude,
            ]}
            zoom={15}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapUpdater position={mapPosition} />

            {position && (
              <Marker
                position={[
                  position.latitude,
                  position.longitude,
                ]}
              >
                <Popup>
                  Your Location
                </Popup>
              </Marker>
            )}

            {friendLocation && (
              <Marker
                position={[
                  friendLocation.latitude,
                  friendLocation.longitude,
                ]}
              >
                <Popup>
                  {friendLocation.email || "Friend's Location"}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <div className="map-message">
            Share your location or track a friend to view the map.
          </div>
        )}
      </div>

      <div className="location-status">
        {isSharing
          ? "Your live location is being shared."
          : "Your location is not currently being shared."}
      </div>
    </div>
  );
}

export default App;
