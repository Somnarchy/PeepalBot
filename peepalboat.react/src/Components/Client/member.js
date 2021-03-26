import React, { Component } from "react";
import InitPQGrid, { GridDataModel } from "../Utils/InitPQGrid";
import { getData } from "../Services/memberService";

export default class Member extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleChangeOrderFilter = this.handleChangeOrderFilter.bind(this);
    this.selChangeOrderStatus = "allchangeorders";

    this.columns1 = [
      {
        title: "Rank",
        width: 80,
        minWidth: 80,
        dataType: "integer",
        dataIndx: "rank",
      },
      { title: "Company", width: 200, dataType: "string", dataIndx: "company" },
      {
        title: "Revenues",
        width: 150,
        dataType: "float",
        dataIndx: "revenues",
        format: "#.0",
      },
      {
        title: "Profits",
        width: 150,
        dataType: "float",
        dataIndx: "profits",
        format: "#.0",
      },
    ];
    this.data1 = getData();
    this.toolbar1 = {
      cls: "pq-toolbar-search",
      items: [
        {
          type: "button",
          label: '<i class="fa fa-filter"></i>&nbsp;Clear filters',
          cls: "btn btn-sm btn-warning",
          attr: ' title="Reset Filter" ',
          listener: function () {
            this.reset({ filter: true });
          },
        },
        { type: "separator" },
        {
          type: "button",
          label: '<i class="fa fa-sync-alt"></i>&nbsp; Refresh',
          cls: "btn btn-sm btn-warning",
          attr: ' title="Reload Page" ',
          listener: function () {
            this.refreshDataAndView();
          },
        },
        { type: "separator" },
        {
          type: "select",
          cls: "selectpicker btn-group-sm text-black",
          attr:
            " id='filterStatus' data-width='300px' data-style='' data-size='15' data-actions-box='true' data-title='<i class=&quot;fa fa-filter&quot;></i> Select Status' data-container='body' data-style='text-black input-sm' data-width='160px' ",
          listener: {
            //"hide.bs.select"
            change: this.handleChangeOrderFilter,
          },
          options: [
            {
              allchangeorders: "All Change Orders",
              mychangeorders: "My Change Orders",
              allopenchangeorders: "All Open Change Order",
              myopenchangeorders: "My Open Change Orders",
            },
          ],
          value: this.selChangeOrderStatus,
        },
      ],
    };
    this.state = {
      height: "600",
      showTitle: false,
      locale: "tr",
      collapsible: { on: false, collapsed: false, toggle: true },
      editable: false,
      editModel: { clicksToEdit: 1, cellBorderWidth: 1, keyUpDown: false },
      filterModel: { on: true, mode: "AND", header: true, type: "local" },
      numberCell: { show: true, title: "#", resizable: false },
      menuIcon: true,
      menuUI: { tabs: ["hideCols"] },
      reactive: true,
      resizable: true,
      columnTemplate: {
        minWidth: "300",
        width: "350",
        maxWidth: "500",
        copy: true,
        resizable: true,
        filter: {
          crules: [{ condition: "contain" }],
          menuIcon: true,
          //conditionExclude: ['range', 'regexp', 'notequal', 'equal'],
          //conditionList: ['between', 'great', 'gte', 'less', 'lte', 'empty'], -- for numeric datatype
          conditionList: [
            "begin",
            "contain",
            "empty",
            "end",
            "notbegin",
            "notcontain",
            "notempty",
            "notend",
          ], //-- for string
        },
      },
      pasteModel: { on: true },
      pageModel: {
        type: "local",
        rPP: 10,
        rPPOptions: [10, 25, 50, 100, 200, 1000, 2000, 5000],
        strRpp: "{0}",
        strDisplay: "Showing {0} - {1} of {2} records",
        layout: [
          "strDisplay",
          "|",
          "first",
          "prev",
          "|",
          "strPage",
          "|",
          "next",
          "last",
          "|",
          "strRpp",
        ],
      },
      toolbar: this.toolbar1,
      colModel: this.columns1,
      animModel: {
        on: true,
      },
      dataModel: { data: this.data1 },
      // dataModel: GridDataModel({
      //   //pageurl: "/views/changeorder/" + this.selChangeOrderStatus,
      //   url: "/changeorderService/ChangeOrderData/" + this.selChangeOrderStatus,
      // }),
    };
  }
  componentDidMount() {
    // let DM = Object.assign({}, this.state.dataModel);
    // DM.data = getData();
    // this.setState({ dataModel: DM });
  }

  handleChange(event) {
    this.setState({ locale: event.target.value });
  }
  handleChangeOrderFilter(event) {
    const selectedVal = event.target.value,
      preValue = this.selChangeOrderStatus;
    if (selectedVal !== null && selectedVal.length <= 0 && preValue !== null) {
      alert("Select at least one option.");
      //Swal("", "Select at least one option.");
      //$(e.target).selectpicker("val", preValue);
    } else if (
      selectedVal !== null &&
      selectedVal.length > 0 &&
      (preValue.toString() !== selectedVal.toString() || preValue === null)
    ) {
      var DM = Object.assign({}, this.state.dataModel);
      DM = GridDataModel({
        //pageurl: "/views/changeorder/" + this.state.selChangeOrderStatus,
        url: "/designactivity/ChangeOrderData/" + selectedVal,
      });
      //document.location.href = `/views/changeorder/${selChangeOrderStatus}`;
      this.selChangeOrderStatus = selectedVal;
      this.setState({ dataModel: DM });
    }
  }
  render() {
    return (
      <div>
        <div style={{ margin: 20 }}>
          <label>Change locale:</label>
          <select value={this.state.locale} onChange={this.handleChange}>
            <option value="en">English</option>
            <option value="ja">Japanese</option>
            <option value="tr">Turkish</option>
          </select>
        </div>

        <InitPQGrid options={this.state} />
      </div>
    );
  }
}
