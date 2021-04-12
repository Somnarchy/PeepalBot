import React, { Component } from "react";

import pq from "pqgrid";
import { saveAs } from "file-saver";
import "jquery-ui-pack/jquery-ui.css";
import "jquery-ui-pack/jquery-ui.structure.css";
import "jquery-ui-pack/jquery-ui.theme.css";

import "pqgrid/pqgrid.min.css";
import "pqgrid/pqgrid.ui.min.css";
import "pqgrid/themes/bootstrap/pqgrid.css";

import { config } from "../Services/httpService";
//import "pqgrid/themes/steelblue/pqgrid.css";

//import pq from "../../Plugins/pqgrid/pqgrid.dev";
//import "../../Plugins/pqgrid/css/pqgrid.bootstrap.css";

//import few localization files for this demo.
//import "../../plugins/pqgrid/localize/pq-localize-en.js";
//import "../../plugins/pqgrid/localize/pq-localize-ja.js";
//import "../../plugins/pqgrid/localize/pq-localize-tr.js";
export function GridDataModel({ pageurl, url }) {
  return {
    dataType: "JSON",
    location: "remote",
    method: "Get",
    recIndx: "Id", // make this field editable:false to prevent from "primary key violation"
    getUrl: function () {
      return {
        url: url,
      };
    },
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", config.headers.Authorization);
      if (pageurl) {
        //window.history.pushState({ html: "", pageTitle: "" }, "", pageurl);
      }
    },
    getData: function (response, textStatus, jqXHR) {
      if (response) {
        return { data: response };
      } else {
        return { data: [] };
      }
    },
    error: function () {},
  };
}

class InitPQGrid extends Component {
  defaultOptions = {
    strLoading: "Loading",
    strNoRows: "No Record(s)",
    showTitle: false,
    locale: "tr",
    editable: false,
    numberCell: { show: true, title: "#", resizable: false },
    height: "600",
    filterModel: { on: true, mode: "AND", header: true, type: "local" },
    menuIcon: true,
    menuUI: { tabs: ["hideCols"] },
    collapsible: { on: false, collapsed: false, toggle: true },
  };
  componentDidMount() {
    this.options = { ...this.props.options, ...this.defaultOptions };
    this.grid = pq.grid(this.refs.grid, this.options);
    this.grid.parentMethods = this.props.parentMethods;
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

  export(fileName) {
    var blob = this.grid.exportData({
      format: "xlsx",
      zip: false,
      nopqdata: true,
      render: true,
    });
    if (typeof blob === "string") {
      blob = new Blob([blob]);
    }
    blob = new Blob([blob], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;",
    });
    saveAs(blob, fileName + ".xlsx");
  }
}
export default InitPQGrid;
