import {useEffect, useState} from "react";
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

import fontawesome from '@fortawesome/fontawesome'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faToilet } from '@fortawesome/free-solid-svg-icons'

function App() {
  const CLIENT_ID = "95da64f2678a49c0bfb5e91ab0b66d1e"
  const SCOPE = "user-top-read"
  const REDIRECT_URI = window.location.protocol + '//' + window.location.host + '/spotify-potty-mouth'
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
  const RESPONSE_TYPE = "token"

  const [token, setToken] = useState("")
  const [searchKey, setSearchKey] = useState("")
  const [artists, setArtists] = useState([])
  const [topTracks, setTopTracks] = useState([])
  const [numTracks, setNumTracks] = useState(0)
  const [numExplicitTracks, setNumExplicitTracks] = useState(0)
  const [readyToRender, setReadyToRender] = useState(false)
  const [username, setUsername] = useState("")
  const [userProfilePictureUrl, setUserProfilePictureUrl] = useState("")
  const [percentageNonExplicit, setPercentageNonExplicit] = useState("100%")

  useEffect(() => {
    const hash = window.location.hash
    let token = window.localStorage.getItem("token")

    if (hash) {
      token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1]
      window.location.hash = ""
      window.localStorage.setItem("token", token)
    }
    setToken(token)
  }, [])

  const getUser = async (e) => {
    const {data} = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    setUsername(data.display_name)
    if (data.images.length > 0) {
      setUserProfilePictureUrl(data.images[0].url)
    }
    searchTopTracks(token)
  }

  const authSpotify = () => {
    window.location.href = AUTH_ENDPOINT + "?client_id=" + CLIENT_ID + "&scope=" + SCOPE + "&redirect_uri=" + REDIRECT_URI + "&response_type=" + RESPONSE_TYPE
  }

  const searchArtists = async (e) => {
    const {data} = await axios.get("https://api.spotify.com/v1/search", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        q: searchKey,
        type: "artist"
      }
    })

    setArtists(data.artists.items)
  }

  const searchTopTracks = async (e) => {
    var {data} = await axios.get("https://api.spotify.com/v1/me/top/tracks", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        limit: 49,
        offset: 0,
        time_range: "medium_term"
      }
    })
    const topTracksGroup1 = data.items

    var {data} = await axios.get("https://api.spotify.com/v1/me/top/tracks", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        limit: 50,
        offset: 49,
        time_range: "medium_term"
      }
    })
    const topTracksGroup2 = data.items

    var top99Tracks = topTracksGroup1.concat(topTracksGroup2)

    var numExplicit = 0
    for (let x in top99Tracks) {
      if (top99Tracks[x].explicit) {
        numExplicit += 1
      }
    }

    setNumTracks(top99Tracks.length)
    setNumExplicitTracks(numExplicit)
    setTopTracks(top99Tracks)
    if (top99Tracks.length > 0) {
      setPercentageNonExplicit(parseInt(100 * (1 - (numExplicit / top99Tracks.length))) + '%')
    }

    setReadyToRender(true)
  }

  const renderTitle = () => {
    return <div>{username ? `${username}'s` : ``} Spotify Potty Mouth:</div>
  }

  const renderFace = () => {
    return <div><img width={"100%"} src={userProfilePictureUrl} alt=""/></div>
  }

  const renderTracks = () => {
    return topTracks.map(track => (
      <div key={track.id}>
        {track.name}
        {track.explicit ? <div>Explicit!</div> : <div>Not Explicit!</div>}
      </div>
    ))
  }

  const renderGeneral = () => {
    if (readyToRender) {
      return <div>
                Found {numExplicitTracks} explicit tracks out of your top {numTracks} tracks within the past 6 months.
              </div>
    }
  }

  const renderToilet = () => {
    if (readyToRender) {
      document.documentElement.style.setProperty('--end-toilet-height', percentageNonExplicit)
      return <div className="Outer">
                  <FontAwesomeIcon key="wToilet" className="Toilet-white" icon={faToilet} size="5x"/>
                  <FontAwesomeIcon key="bToilet" className="Toilet-brown" icon={faToilet} size="5x"/>
              </div>
    }
  }

  fontawesome.library.add(faToilet);

  return (
    <div className="App">
      <header className="App-header">
        {renderTitle()}
        <div>
          <button onClick={authSpotify}>Login to Spotify</button>
        </div>
        <div>
          {token ? <button onClick={getUser}>Get top tracks</button> : <h2>Please login</h2>}
        </div>
        {renderToilet()}
        {renderGeneral()}
      </header>
    </div>
  );
}

export default App;
