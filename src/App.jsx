import { useEffect, useState } from "react"
import "./App.css"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"

import "leaflet/dist/leaflet.css"

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"

import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore"

import { auth, db } from "./firebase"

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

  const [position, setPosition] = useState(null)

  const [friendEmail, setFriendEmail] = useState("")
  const [friendLocation, setFriendLocation] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })

    return () => unsubscribe()
  }, [])

  const createAccount = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      alert("Account Created Successfully")
    } catch (error) {
      alert(error.message)
    }
  }

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      alert(error.message)
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const shareLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (location) => {
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }

        setPosition([coords.latitude, coords.longitude])

        await setDoc(doc(db, "locations", user.email), {
          email: user.email,
          latitude: coords.latitude,
          longitude: coords.longitude,
        })

        alert("Location Shared")
      },
      () => {
        alert("Location Permission Denied")
      }
    )
  }

  const trackFriend = async () => {
    if (!friendEmail) {
      alert("Enter friend's email")
      return
    }

    const docRef = doc(db, "locations", friendEmail)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()

      setFriendLocation([
        data.latitude,
        data.longitude,
      ])
    } else {
      alert("No location found")
    }
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>TrackTogether</h1>

          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={createAccount}>
            Create Account
          </button>

          <button
            className="login-btn"
            onClick={login}
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="main-container">
      <div className="top-bar">
        <div>
          <h1>TrackTogether</h1>
          <p>{user.email}</p>
        </div>

        <div className="buttons">
          <button onClick={shareLocation}>
            Share Location
          </button>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="track-box">
        <input
          type="text"
          placeholder="Enter friend's email"
          value={friendEmail}
          onChange={(e) =>
            setFriendEmail(e.target.value)
          }
        />

        <button onClick={trackFriend}>
          Track User
        </button>
      </div>

      {position && (
        <MapContainer
          center={position}
          zoom={13}
          style={{
            height: "540px",
            width: "100%",
            borderRadius: "28px",
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
      )}
    </div>
  )
}

export default App