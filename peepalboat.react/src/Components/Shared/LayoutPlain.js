import React from "react";
import { Container } from "react-bootstrap/Container";

export default (props) => (
  <div>
    <Container>{props.children}</Container>
  </div>
);
