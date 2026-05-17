import { useState } from "react"

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet"

import L from "leaflet"

import "leaflet/dist/leaflet.css"

import { db, auth } from "./firebase"

import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore"

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth"

// FIX MARKER ICON
delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

function App() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [user, setUser] = useState(null)

  // NO DEFAULT LOCATION
  const [position, setPosition] =
    useState(null)

  const [searchEmail, setSearchEmail] =
    useState("")

  const [friendLocation, setFriendLocation] =
    useState(null)

  // CREATE ACCOUNT
  const createAccount = async () => {
    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        )

      setUser(userCredential.user)

      alert("Account Created Successfully")
    } catch (error) {
      alert(error.message)
    }
  }

  // LOGIN
  const login = async () => {
    try {
      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        )

      setUser(userCredential.user)

      alert("Login Successful")
    } catch (error) {
      alert(error.message)
    }
  }

  // LOGOUT
  const logout = async () => {
    await signOut(auth)

    setUser(null)
    setPosition(null)
    setFriendLocation(null)
  }

  // SHARE LOCATION
  const getLocation = () => {
    navigator.geolocation.watchPosition(
      async (location) => {
        const latitude =
          location.coords.latitude

        const longitude =
          location.coords.longitude

        const coords = [
          latitude,
          longitude,
        ]

        setPosition(coords)

        await setDoc(
          doc(db, "locations", user.email),
          {
            email: user.email,
            latitude: latitude,
            longitude: longitude,
            updatedAt: new Date(),
          }
        )
      },
      () => {
        alert("Location Permission Denied")
      }
    )
  }

  // TRACK FRIEND
  const trackFriend = async () => {
    try {
      const docRef = doc(
        db,
        "locations",
        searchEmail
      )

      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()

        setFriendLocation([
          data.latitude,
          data.longitude,
        ])

        alert("Location Found")
      } else {
        alert("No user found")
      }
    } catch (error) {
      alert(error.message)
    }
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #020617, #0f172a, #1e293b)",

          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            width: "380px",
            background: "#071126",
            padding: "40px",
            borderRadius: "28px",

            boxShadow:
              "0 0 40px rgba(0,0,0,0.5)",
          }}
        >
          <h1
            style={{
              color: "white",
              textAlign: "center",
              fontSize: "48px",
              marginBottom: "35px",
              fontWeight: "bold",
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
              padding: "16px",
              marginBottom: "18px",
              borderRadius: "14px",
              border: "none",
              background: "#111827",
              color: "white",
              fontSize: "15px",
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
              padding: "16px",
              marginBottom: "22px",
              borderRadius: "14px",
              border: "none",
              background: "#111827",
              color: "white",
              fontSize: "15px",
            }}
          />

          <button
            onClick={createAccount}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "14px",
              border: "none",
              background: "#2563eb",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "14px",
              cursor: "pointer",
            }}
          >
            Create Account
          </button>

          <button
            onClick={login}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "14px",
              border: "none",
              background: "#16a34a",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  // MAIN APP
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #020617, #0f172a, #1e293b)",

        padding: "30px",
        fontFamily: "Arial",
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          width: "90%",
          margin: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <div>
          <h1
            style={{
              color: "white",
              fontSize: "64px",
              margin: 0,
              fontWeight: "bold",
              lineHeight: "65px",
            }}
          >
            TrackTogether
          </h1>

          <p
            style={{
              color: "#94a3b8",
              marginTop: "10px",
              fontSize: "16px",
              marginLeft: "4px",
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
            onClick={getLocation}
            style={{
              padding:
                "16px 28px",
              borderRadius: "16px",
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: "bold",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Share Location
          </button>

          <button
            onClick={logout}
            style={{
              padding:
                "16px 28px",
              borderRadius: "16px",
              border: "none",
              background: "#dc2626",
              color: "white",
              fontWeight: "bold",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div
        style={{
          width: "90%",
          margin: "auto",
          marginBottom: "25px",
          display: "flex",
          gap: "14px",
        }}
      >
        <input
          type="text"
          placeholder="Enter friend's email"
          value={searchEmail}
          onChange={(e) =>
            setSearchEmail(e.target.value)
          }
          style={{
            flex: 1,
            padding: "18px",
            borderRadius: "16px",
            border: "none",
            background: "#111827",
            color: "white",
            fontSize: "15px",
          }}
        />

        <button
          onClick={trackFriend}
          style={{
            padding:
              "18px 30px",
            borderRadius: "16px",
            border: "none",
            background: "#7c3aed",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Track User
        </button>
      </div>

      {/* MAP */}
      {position && (
        <MapContainer
          center={position}
          zoom={15}
          style={{
            height: "75vh",
            width: "90%",
            margin: "auto",
            borderRadius: "28px",
            overflow: "hidden",

            boxShadow:
              "0 0 40px rgba(0,0,0,0.4)",
          }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* YOUR LOCATION */}
          <Marker position={position}>
            <Popup>
              Your Live Location
            </Popup>
          </Marker>

          {/* FRIEND LOCATION */}
          {friendLocation && (
            <Marker
              position={friendLocation}
            >
              <Popup>
                Friend Location
              </Popup>
            </Marker>
          )}
        </MapContainer>
      )}
    </div>
  )
}

export default App