import React, { Component } from "react";
import { Route, Redirect, Switch } from "react-router-dom";
import Header from "./Components/Shared/Header";
import SideBar from "./Components/Shared/SideBar";

import Dashboard from "./Components/Client/dashboard";

class App extends Component {
  render() {
    return (
      <React.Fragment>
        <Header />
        <SideBar />
        <main className="container">
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/not-found" component={NotFound} />
            <Redirect from="/" to="/dashboard" exact />
            <Redirect to="/not-found" />
          </Switch>
        </main>
      </React.Fragment>
    );
  }
}

export default App;
