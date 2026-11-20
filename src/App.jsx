
import { useState, useEffect, useRef } from "react";

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

// ========================================
// FIX LEAFLET DEFAULT MARKER ICON
// ========================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ========================================
// MAP CENTER UPDATE COMPONENT
// ========================================

function MapUpdater({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);

  return null;
}

// ========================================
// MAIN APPLICATION
// ========================================

function App() {
  // AUTHENTICATION STATES

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // LOCATION STATES

  const [position, setPosition] = useState(null);
  const [friendLocation, setFriendLocation] = useState(null);

  const [searchEmail, setSearchEmail] = useState("");

  const [sharing, setSharing] = useState(false);
  const [tracking, setTracking] = useState(false);

  // REFERENCES FOR CLEANUP

  const watchId = useRef(null);
  const unsubscribeFriend = useRef(null);

  // ========================================
  // CHECK AUTHENTICATION STATUS
  // ========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ========================================
  // STOP LOCATION SHARING
  // ========================================

  const stopLocationSharing = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    setSharing(false);
  };

  // ========================================
  // STOP FRIEND TRACKING
  // ========================================

  const stopTracking = () => {
    if (unsubscribeFriend.current) {
      unsubscribeFriend.current();
      unsubscribeFriend.current = null;
    }

    setFriendLocation(null);
    setTracking(false);
  };

  // ========================================
  // CLEANUP ON COMPONENT UNMOUNT
  // ========================================

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

  // ========================================
  // CREATE ACCOUNT
  // ========================================

  const createAccount = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      alert("Account Created Successfully");

      setPassword("");
    } catch (error) {
      alert(error.message);
    }
  };

  // ========================================
  // LOGIN
  // ========================================

  const login = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      alert("Login Successful");

      setPassword("");
    } catch (error) {
      alert(error.message);
    }
  };

  // ========================================
  // LOGOUT
  // ========================================

  const logout = async () => {
    try {
      stopLocationSharing();
      stopTracking();

      await signOut(auth);

      setPosition(null);
      setSearchEmail("");

      alert("Logged Out Successfully");
    } catch (error) {
      alert(error.message);
    }
  };

  // ========================================
  // SHARE LIVE LOCATION
  // ========================================

  const getLocation = () => {
    if (!user) return;

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser");
      return;
    }

    if (watchId.current !== null) {
      return;
    }

    setSharing(true);

    watchId.current = navigator.geolocation.watchPosition(
      async (location) => {
        const latitude = location.coords.latitude;
        const longitude = location.coords.longitude;

        const coords = [latitude, longitude];

        setPosition(coords);

        try {
          await setDoc(
            doc(db, "locations", user.email.toLowerCase()),
            {
              email: user.email,
              latitude,
              longitude,
              accuracy: location.coords.accuracy,
              updatedAt: serverTimestamp(),
            }
          );
        } catch (error) {
          console.error("Location upload error:", error);
          alert("Unable to save location: " + error.message);
        }
      },

      (error) => {
        stopLocationSharing();

        if (error.code === 1) {
          alert("Location Permission Denied");
        } else if (error.code === 2) {
          alert("Location information is unavailable");
        } else if (error.code === 3) {
          alert("Location request timed out");
        } else {
          alert(error.message);
        }
      },

      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  };

  // ========================================
  // TRACK FRIEND'S LIVE LOCATION
  // ========================================

  const trackFriend = () => {
    if (!searchEmail.trim()) {
      alert("Please enter your friend's email");
      return;
    }

    const friendEmail = searchEmail.trim().toLowerCase();

    if (friendEmail === user.email.toLowerCase()) {
      alert("You cannot track your own account as a friend");
      return;
    }

    stopTracking();

    const friendRef = doc(
      db,
      "locations",
      friendEmail
    );

    setTracking(true);

    unsubscribeFriend.current = onSnapshot(
      friendRef,

      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          setFriendLocation([
            data.latitude,
            data.longitude,
          ]);
        } else {
          setFriendLocation(null);
          alert("No shared location found for this user");
        }
      },

      (error) => {
        console.error("Tracking error:", error);

        setTracking(false);
        alert("Unable to track user: " + error.message);
      }
    );
  };

  // ========================================
  // LOADING SCREEN
  // ========================================

  if (authLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Got_Track</h1>
          <p style={{ color: "#94a3b8", textAlign: "center" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // LOGIN / REGISTRATION SCREEN
  // ========================================

  if (!user) {
    return (
      <div className="auth-container">

        <div className="auth-card">

          <h1 className="auth-title">
            Got_Track
          </h1>

          <form onSubmit={(e) => e.preventDefault()}>

            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="create-account-btn"
              onClick={createAccount}
            >
              Create Account
            </button>

            <button
              type="button"
              className="login-btn"
              onClick={login}
            >
              Login
            </button>

          </form>

        </div>

      </div>
    );
  }

  // ========================================
  // MAIN DASHBOARD
  // ========================================

  return (
    <div className="app-container">

      {/* TOP HEADER */}

      <div className="top-bar">

        <div>

          <h1 className="app-title">
            Got_Track
          </h1>

          <p className="user-email">
            {user.email}
          </p>

        </div>

        <div className="header-actions">

          <button
            className="share-btn"
            onClick={getLocation}
            disabled={sharing}
          >
            {sharing ? "Location Sharing Active" : "Share Location"}
          </button>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </div>

      {/* FRIEND SEARCH BAR */}

      <div className="search-container">

        <input
          type="email"
          placeholder="Enter friend's email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
        />

        <button
          className="track-btn"
          onClick={trackFriend}
        >
          {tracking ? "Tracking..." : "Track User"}
        </button>

      </div>

      {/* MAP */}

      {(position || friendLocation) && (

        <div className="map-container">

          <MapContainer
            center={position || friendLocation}
            zoom={15}
            scrollWheelZoom={true}
          >

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapUpdater
              position={position || friendLocation}
            />

            {/* YOUR LOCATION */}

            {position && (

              <Marker position={position}>

                <Popup>
                  Your Live Location
                </Popup>

              </Marker>

            )}

            {/* FRIEND LOCATION */}

            {friendLocation && (

              <Marker position={friendLocation}>

                <Popup>
                  Friend's Live Location
                </Popup>

              </Marker>

            )}

          </MapContainer>

        </div>

      )}

      {/* EMPTY MAP MESSAGE */}

      {!position && !friendLocation && (

        <div
          style={{
            width: "90%",
            margin: "auto",
            minHeight: "350px",
            borderRadius: "28px",
            background: "#111827",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#94a3b8",
            textAlign: "center",
            padding: "30px",
          }}
        >

          <div>

            <h2 style={{ color: "white", marginBottom: "12px" }}>
              Welcome to Got_Track
            </h2>

            <p>
              Click Share Location to display your current
              location or search for a friend to track them.
            </p>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;
