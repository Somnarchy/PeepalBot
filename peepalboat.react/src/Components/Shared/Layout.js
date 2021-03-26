import React from "react";
import { Row, Col } from "react-bootstrap";
import { Container } from "react-bootstrap/Container";
import Header from "./Header";
import SidebarMenu from "./SidebarMenu";
import "../../Css/Adminlte.min.css";
import "@fortawesome/fontawesome-free/js/all.js";

export default (props) => {
  return (
    <div className="wrapper">
      <Header />
      <SidebarMenu />
      <div className="content-wrapper">
        <div className="content-header">
          <div className="content-fluid">content-header</div>
        </div>
        <section className="content">
          <div className="container-fluid">{props.children}</div>
        </section>
      </div>
    </div>
  );
};
