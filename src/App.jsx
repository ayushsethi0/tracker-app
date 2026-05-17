import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(null);

  const [position, setPosition] = useState([28.6139, 77.209]);

  const [friendEmail, setFriendEmail] = useState("");

  const [friendLocation, setFriendLocation] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const createAccount = async () => {
    try {
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Account Created Successfully");
    } catch (error) {
      alert(error.message);
    }
  };

  const login = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Login Successful");
    } catch (error) {
      alert(error.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const shareLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;

        setPosition([latitude, longitude]);

        await setDoc(doc(db, "locations", user.email), {
          latitude,
          longitude,
          email: user.email,
          updatedAt: new Date(),
        });

        alert("Location Shared Successfully");
      },
      (err) => {
        alert(err.message);
      }
    );
  };

  const trackFriend = async () => {
    if (!friendEmail) {
      alert("Enter friend's email");
      return;
    }

    const docRef = doc(db, "locations", friendEmail);

    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      setFriendLocation([
        data.latitude,
        data.longitude,
      ]);
    } else {
      alert("Friend location not found");
    }
  };

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(to bottom right,#020617,#0f172a,#1e293b)",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            width: "400px",
            background: "#0f172a",
            padding: "40px",
            borderRadius: "25px",
            boxShadow:
              "0 0 40px rgba(0,0,0,0.5)",
          }}
        >
          <h1
            style={{
              color: "white",
              textAlign: "center",
              fontSize: "48px",
              marginBottom: "30px",
            }}
          >
            TrackTogether
          </h1>

          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            style={{
              width: "100%",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "12px",
              border: "none",
              background: "#1e293b",
              color: "white",
              fontSize: "16px",
            }}
          />

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            style={{
              width: "100%",
              padding: "15px",
              marginBottom: "25px",
              borderRadius: "12px",
              border: "none",
              background: "#1e293b",
              color: "white",
              fontSize: "16px",
            }}
          />

          <button
            onClick={createAccount}
            style={{
              width: "100%",
              padding: "15px",
              border: "none",
              borderRadius: "12px",
              background: "#2563eb",
              color: "white",
              fontSize: "18px",
              cursor: "pointer",
              marginBottom: "15px",
            }}
          >
            Create Account
          </button>

          <button
            onClick={login}
            style={{
              width: "100%",
              padding: "15px",
              border: "none",
              borderRadius: "12px",
              background: "#16a34a",
              color: "white",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom right,#020617,#0f172a,#1e293b)",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <div>
            <h1
              style={{
                color: "white",
                fontSize: "72px",
                margin: 0,
                lineHeight: "70px",
              }}
            >
              TrackTogether
            </h1>

            <p
              style={{
                color: "#94a3b8",
                marginTop: "10px",
                fontSize: "18px",
              }}
            >
              {user.email}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "15px",
            }}
          >
            <button
              onClick={shareLocation}
              style={{
                padding: "16px 28px",
                borderRadius: "14px",
                border: "none",
                background: "#2563eb",
                color: "white",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              Share Location
            </button>

            <button
              onClick={logout}
              style={{
                padding: "16px 28px",
                borderRadius: "14px",
                border: "none",
                background: "#dc2626",
                color: "white",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "25px",
          }}
        >
          <input
            type="text"
            placeholder="Enter friend's email"
            value={friendEmail}
            onChange={(e) =>
              setFriendEmail(e.target.value)
            }
            style={{
              flex: 1,
              padding: "18px",
              borderRadius: "14px",
              border: "none",
              background: "#0f172a",
              color: "white",
              fontSize: "17px",
            }}
          />

          <button
            onClick={trackFriend}
            style={{
              padding: "18px 28px",
              borderRadius: "14px",
              border: "none",
              background: "#7c3aed",
              color: "white",
              fontSize: "17px",
              cursor: "pointer",
            }}
          >
            Track User
          </button>
        </div>

        <MapContainer
          center={position}
          zoom={13}
          style={{
            height: "650px",
            width: "100%",
            borderRadius: "24px",
            overflow: "hidden",
          }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={position}>
            <Popup>Your Live Location</Popup>
          </Marker>

          {friendLocation && (
            <Marker position={friendLocation}>
              <Popup>Friend Location</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;