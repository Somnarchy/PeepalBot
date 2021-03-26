import React from "react";
import { Route } from "react-router";
import Layout from "./Components/Shared/Layout";

const AppRoute = ({ component: Component, layout: LayoutName, ...rest }) => {
  LayoutName = !LayoutName ? Layout : LayoutName;
  return (
    <Route
      {...rest}
      render={(props) => (
        <LayoutName>
          <Component {...props} />
        </LayoutName>
      )}
    />
  );
};
export default AppRoute;
