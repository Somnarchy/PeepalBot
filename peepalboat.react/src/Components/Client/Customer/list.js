import React, { Component } from "react";
import InitPQGrid, { GridDataModel } from "../../Utils/InitPQGrid";
import {
  getData,
  save,
  remove,
  update,
  endPoint,
} from "../../Services/customerService";

//import { Modal, Button } from "react-bootstrap";
import AddForm from "./add";
import EditForm from "./add";

export default class List extends Component {
  constructor(props) {
    super(props);

    //we have to asssign this to different variable
    // so that it can be access inside columns
    const $that = this;
    this.handleChangeOrderFilter = this.handleChangeOrderFilter.bind(this);

    this.selChangeOrderStatus = "allchangeorders";
    this.handleExport = this.handleExport.bind(this);

    this.columns1 = [
      {
        title: "First Name",
        width: 100,
        dataType: "string",
        dataIndx: "FirstName",
      },
      {
        title: "M Name",
        width: 100,
        dataType: "string",
        dataIndx: "MiddleName",
      },
      {
        title: "Last Name",
        width: 100,
        dataType: "string",
        dataIndx: "LastName",
      },
      {
        title: "Description",
        width: 150,
        dataType: "string",
        dataIndx: "Description",
      },
      {
        title: "Contact Info",
        align: "center",
        menuInClose: true,
        colModel: [
          {
            title: "Address1",
            width: 100,
            dataType: "string",
            dataIndx: "Address1",
          },
          {
            title: "Address2",
            width: 100,
            dataType: "string",
            dataIndx: "Address2",
          },
          { title: "City", width: 100, dataType: "string", dataIndx: "City" },
          {
            title: "ZipCode",
            width: 80,
            dataType: "string",
            dataIndx: "ZipCode",
          },
          { title: "Phone", width: 200, dataType: "string", dataIndx: "Phone" },
          {
            title: "Created Date",
            width: 100,
            dataType: "string",
            dataIndx: "CreatedDate",
          },
        ],
      },
      {
        title: "Id",
        dataType: "integer",
        dataIndx: "Id",
        hidden: true,
        copy: false,
        exportRender: false,
        filter: null,
        menuInHide: true,
      },
      {
        title: "Action",
        dataIndx: "action",
        dataType: "string",
        align: "middle",
        width: "100",
        minWidth: "100",
        maxWidth: "250",
        sortable: false,
        copy: false,
        exportRender: false,
        filter: null,
        menuInHide: true,
        render: function (ui) {
          return `<button class="btn btn-xs btn-default btn-edit"><i class="fa fa-pen"></i></button>&nbsp;<button class="btn btn-xs btn-default btn-delete"><i class="fa fa-trash"></i></button>`;
        },
        postRender: function (ui) {
          let rowIndx = ui.rowIndx,
            rowData = ui.rowData,
            grid = this,
            $cell = grid.getCell(ui);
          $cell
            .find("button.btn-edit")
            //.button({ icons: { primary: "ui-icon-scissors" } })
            .bind("click", function () {
              grid.addClass({ rowIndx: rowIndx, cls: "pq-row-delete" });
              //console.log($that);
              //grid.parentMethods.showModal();
              $that.showEditModal(rowIndx, {
                name: rowData.Name,
                description: rowData.Description,
                id: rowData.Id,
              });
            });
          $cell
            .find("button.btn-delete")
            //.button({ icons: { primary: "ui-icon-scissors" } })
            .bind("click", function () {
              //console.log($that);
              let ans = window.confirm(
                "Are you sure to delete row No " + (rowIndx + 1) + "?"
              );
              grid.removeClass({ rowIndx: rowIndx, cls: "pq-row-delete" });
              if (ans) {
                remove(ui.rowData.Id);
                grid.deleteRow({ rowIndx: rowIndx });
              }
            });
        },
      },
    ];
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
          type: "button",
          label: '<i class="fa fa-plus"></i>&nbsp; Add',
          cls: "btn btn-sm btn-warning",
          attr: ' title="Export" ',
          listener: this.showAddModal,
        },
        {
          type: "button",
          label: '<i class="fa fa-download"></i>&nbsp; Export',
          cls: "btn btn-sm btn-warning",
          attr: ' title="Export" ',
          listener: this.handleExport,
          // listener: function () {
          //   alert("dd'");
          //   console.log(this);
          //   this.handleExport();
          // },
        },
      ],
    };
    this.gridObject = {
      editModel: { clicksToEdit: 1, cellBorderWidth: 1, keyUpDown: false },
      reactive: true,
      resizable: true,
      columnTemplate: {
        minWidth: "80",
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
        rPP: 50,
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
      postRenderInterval: -1, //call postRender synchronously.
      toolbar: this.toolbar1,
      colModel: this.columns1,
      animModel: {
        on: true,
      },
      dataModel: { data: [] },
    };
    this.state = {
      gridObject: this.gridObject,
      formData: { name: "", description: "", id: "", rowIndex: "" },
      showAddForm: false,
      modalComponent: [],
    };
  }
  getGridUrl = () => {
    return `${endPoint}?rand=${Math.random()}`;
  };
  async componentDidMount() {
    let gridObj = this.state.gridObject;
    let DM = Object.assign({}, gridObj.dataModel);
    DM = GridDataModel({
      //pageurl: "/views/changeorder/" + gridObj.selChangeOrderStatus,
      url: this.getGridUrl(),
    });
    gridObj.dataModel = DM;
    this.setState({ gridObject: gridObj });
  }

  handleChangeOrderFilter(event) {
    console.log(this);
    const gridObj = this.state.gridObject;
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
      var DM = Object.assign({}, gridObj.dataModel);
      DM = GridDataModel({
        //pageurl: "/views/changeorder/" + gridObj.selChangeOrderStatus,
        url: this.getGridUrl(),
      });

      this.selChangeOrderStatus = selectedVal;
      gridObj.dataModel = DM;
      this.setState({ gridObject: gridObj });
    }
  }
  handleExport = (event) => {
    this.refs.grid.export("document-type");
  };

  handleSave = async (data) => {
    var response = await save(data);
    this.refs.grid.grid.addRow({
      newRow: response,
      checkEditable: false,
    });
    this.setState({
      showAddForm: false,
    });
  };
  handleUpdate = async (rowIndex, data) => {
    const postData = { ...data };
    delete postData.rowIndex;
    let response = await update(postData);
    const { Id, Name, Description } = response;

    this.refs.grid.grid.updateRow({
      rowIndx: rowIndex,
      newRow: { Id, Name, Description },
      checkEditable: false,
    });
    this.setState({
      modalComponent: [],
    });
  };
  showAddModal = () => {
    this.setState({
      showAddForm: true,
    });
  };
  hideAddModal = () => {
    this.setState({
      showAddForm: false,
    });
  };
  showEditModal = (rowIndex, formData) => {
    const fData = { ...formData, rowIndex: rowIndex };
    this.setState({
      rowIndex: rowIndex,
      modalComponent: [{ formData: fData }],
    });
  };
  hideEditModal = () => {
    this.setState({
      modalComponent: [],
    });
  };
  render() {
    const { formData, modalComponent } = this.state;

    return (
      <div>
        <AddForm
          show={this.state.showAddForm}
          onSubmit={this.handleSave}
          hideModal={this.hideAddModal}
          formData={formData}
        />
        {modalComponent.length !== 0 &&
          modalComponent.map((obj, i) => (
            <EditForm
              key={i}
              show={true}
              onSubmit={this.handleUpdate}
              hideModal={this.hideEditModal}
              formData={obj.formData}
            />
          ))}
        <InitPQGrid
          options={this.state.gridObject}
          parentMethods={this.parentMethods}
          ref="grid"
        />
      </div>
    );
  }
}
