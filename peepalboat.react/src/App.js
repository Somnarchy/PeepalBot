import React, { Component } from "react";
import { Redirect, Switch } from "react-router-dom";
import AppRoute from "./AppRoute";
import Layout from "./Components/Shared/Layout";
//import LayoutPlain from "./Components/Shared/LayoutPlain";

import Dashboard from "./Components/Client/dashboard";
import Member from "./Components/Client/member";
import NotFound from "./Components/notFound";
import AccountType from "./Components/Client/AccountType/list";
import DocumentType from "./Components/Client/DocumentType/list";
import Customer from "./Components/Client/Customer/list";
import CustomerDocument from "./Components/Client/CustomerDocument/list";

//import "./App.css";

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
          <AppRoute
            path="/accounttype"
            component={AccountType}
            layout={Layout}
          />
          <AppRoute
            path="/documenttype"
            component={DocumentType}
            layout={Layout}
          />
          <AppRoute path="/customer" component={Customer} layout={Layout} />
          <AppRoute
            path="/customerdocument"
            component={CustomerDocument}
            layout={Layout}
          />
          <AppRoute path="/not-found" component={NotFound} />
          <Redirect to="/not-found" />
        </Switch>
      </React.Fragment>
    );
  }
}

export default App;
