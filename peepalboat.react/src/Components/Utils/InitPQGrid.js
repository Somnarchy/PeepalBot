import React, { Component } from "react";

import pq from "pqgrid";
import "jquery-ui-pack/jquery-ui.css";
import "jquery-ui-pack/jquery-ui.structure.css";
import "jquery-ui-pack/jquery-ui.theme.css";

import "pqgrid/pqgrid.min.css";
import "pqgrid/pqgrid.ui.min.css";
import "pqgrid/themes/bootstrap/pqgrid.css";
//import "pqgrid/themes/steelblue/pqgrid.css";

//import pq from "../../Plugins/pqgrid/pqgrid.dev";
//import "../../Plugins/pqgrid/css/pqgrid.bootstrap.css";

//import few localization files for this demo.
//import "../../plugins/pqgrid/localize/pq-localize-en.js";
//import "../../plugins/pqgrid/localize/pq-localize-ja.js";
//import "../../plugins/pqgrid/localize/pq-localize-tr.js";
export function GridDataModel({ pageurl, url }) {
  return {
    stripeRows: true,
    rowBorders: false,
    dataType: "JSON",
    location: "remote",
    method: "Get",
    recIndx: "Id", // make this field editable:false to prevent from "primary key violation"
    getUrl: function () {
      return {
        url: url,
      };
    },
    beforeSend: function () {
      if (pageurl) {
        //window.history.pushState({ html: "", pageTitle: "" }, "", pageurl);
      }
    },
    getData: function (response, textStatus, jqXHR) {
      if (response.status === 1) {
        return { data: response.data };
      } else {
        return { data: [] };
      }
    },
    error: function () {},
  };
}

class InitPQGrid extends Component {
  componentDidMount() {
    this.options = this.props.options;
    pq.grid(this.refs.grid, this.options);
  }
  componentDidUpdate(prevProps) {
    /*var src = this.props.options, dest = this.options;
        for(var key in src){
          if(src[key] != dest[key])
            dest[key] = src[key]
        }*/
    Object.assign(this.options, this.props.options);
  }
  render() {
    return <div ref="grid"></div>;
  }
}
export default InitPQGrid;
