import {useEffect, useState} from "react";
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

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

  const authSpotify = () => {
    window.location.href = AUTH_ENDPOINT + "?client_id=" + CLIENT_ID + "&scope=" + SCOPE + "&redirect_uri=" + REDIRECT_URI + "&response_type=" + RESPONSE_TYPE
  }

  const searchArtists = async (e) => {
    e.preventDefault()
    const {data} = await axios.get("https://api.spotify.com/v1/search", {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        q: searchKey,
        type: "artist"
      }
    })

    console.log(data)

    setArtists(data.artists.items)
  }

  const searchTopTracks = async (e) => {
    e.preventDefault()
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
    console.log(top99Tracks)

    setReadyToRender(true)
  }

  const renderArtists = () => {
    return artists.map(artist => (
      <div key={artist.id}>
        {artist.images.length ? <img width={"100%"} src={artist.images[0].url} alt=""/> : <div>No Image</div>}
        {artist.name}
      </div>
    ))
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
    return <div>{readyToRender ? `Found ${numExplicitTracks} explicit tracks out of your top ${numTracks} tracks within the past 6 months.` : ``}</div>
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div>
          <button onClick={authSpotify}>Login to Spotify</button>
        </div>
        <div>
          {token ? <button onClick={searchTopTracks}>Get top tracks</button> : <h2>Please login</h2>}
        </div>
        {renderArtists()}
        {renderGeneral()}
      </header>
    </div>
  );
}

export default App;
