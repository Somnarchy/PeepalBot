import React, { Component } from "react";
import { Redirect, Switch } from "react-router-dom";
import AppRoute from "./AppRoute";
import Layout from "./Components/Shared/Layout";
//import LayoutPlain from "./Components/Shared/LayoutPlain";

import Dashboard from "./Components/Client/dashboard";
import Member from "./Components/Client/member";
import NotFound from "./Components/notFound";

class App extends Component {
  render() {
    return (
      <React.Fragment>
        <Switch>
          <AppRoute exact path="/" component={Dashboard} layout={Layout} />
          <AppRoute path="/dashboard" component={Dashboard} layout={Layout} />
          {/*<AppRoute
              path="/pqgridsample"
              component={PQGridSample}
              layout={Layout}
            />*/}
          <AppRoute path="/member" component={Member} layout={Layout} />
          <AppRoute path="/not-found" component={NotFound} />
          <Redirect to="/not-found" />
        </Switch>
      </React.Fragment>
    );
  }
}

export default App;
