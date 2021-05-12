import React, { useState } from "react";
import "./App.css";
import axios from "axios";
import Cookies from "js-cookie";

function App() {
  const [user, setUser] = useState({});
  const [error, setError] = useState("");
  const refresh = (refreshToken) => {
    console.log("Refreshing Token");

    return new Promise((resolve, reject) => {
      axios
        .post("http://localhost:5000/refresh", { token: refreshToken })
        .then((data) => {
          if (data.data.success === false) {
            setError("Login again");
            // set message and return
            resolve(false);
          } else {
            const { accessToken } = data.data;
            Cookies.set("accessToken", accessToken);
            resolve(accessToken);
          }
        });
    });
  };
  const requestLogin = async (accessToken, refreshToken) => {
    console.log(accessToken, refreshToken);
    return new Promise((resolve, reject) => {
      axios
        .post(
          "http://localhost:5000/protected",
          {},
          {
            headers: { authorization: `Bearer ${accessToken}` },
          }
        )
        .then(async (data) => {
          if (data.data.success === false) {
            if (data.data.message === "User not Authenticated") {
              // set err message to login again.
              setError("User please login again");
            } else if (data.data.message === "Access token expired") {
              const accessToken = await refresh(refreshToken);
              return await requestLogin(accessToken, refreshToken);
            }
            resolve(false);
          } else {
            // Protected route hase beeen accessed
            // reponse can be used
            setError("Protected root accessed");
            resolve(true);
          }
        });
    });
  };
  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
    console.log(user);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://localhost:5000/login", { user }).then((data) => {
      const { accessToken, refreshToken } = data.data;
      Cookies.set("accessToken", accessToken);
      Cookies.set("refreshToken", refreshToken);
    });
  };
  const hasAccess = async (accessToken, refreshToken) => {
    if (!refreshToken) {
      return null;
    }
    if (accessToken === undefined) {
      // create new accessToken
      // Because cookies have expiry time
      accessToken = await refresh(refreshToken);
      return accessToken;
    }
    return accessToken;
  };

  // check if access token is valid
  const protect = async (e) => {
    let accessToken = Cookies.get("accessToken");
    let refreshToken = Cookies.get("refreshToken");

    accessToken = await hasAccess(accessToken, refreshToken);
    if (!accessToken) {
      // restrict user
    } else {
      await requestLogin(accessToken, refreshToken);
    }
  };

  return (
    <div className="App">
      <form action="" onChange={handleChange} onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="Email address" />
        <br />
        <br />
        <input name="password" type="password" placeholder="Password" />
        <br />
        <br />
        <input type="submit" value="Login" />
        <br />
        <br />
      </form>
      {error}
      <button onClick={protect}>Access Protected Content</button>
    </div>
  );
}

export default App;
