import React, { Component, useState } from "react";
import InitPQGrid, { GridDataModel } from "../../Utils/InitPQGrid";
import { getData } from "../../Services/accountTypeService";
import { Modal, Button } from "react-bootstrap";

// function AccountTypeEditForm(props) {
//   console.log(props);

//   const [show, setShow] = useState(false);

//   const handleClose = () => setShow(false);
//   const handleShow = () => setShow(true);
//   return (
//     <div>
//       <Modal
//         show={show}
//         onHide={handleClose}
//         backdrop="static"
//         keyboard={false}
//       >
//         <Modal.Header closeButton>
//           <Modal.Title>Modal heading</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={handleClose}>
//             Close
//           </Button>
//           <Button variant="primary" onClick={handleClose}>
//             Save Changes
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// }
export default class List extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleChangeOrderFilter = this.handleChangeOrderFilter.bind(this);
    this.selChangeOrderStatus = "allchangeorders";
    this.showModal = this.showModal.bind(this);
    this.hideModal = this.hideModal.bind(this);

    const columns1 = [
      {
        title: "Id",
        width: 80,
        minWidth: 80,
        dataType: "integer",
        dataIndx: "Id",
      },
      { title: "Name", width: 200, dataType: "string", dataIndx: "Name" },
      {
        title: "Description",
        width: 150,
        dataType: "string",
        dataIndx: "Description",
      },
      {
        title: "Action",
        dataIndx: "action",
        dataType: "string",
        align: "middle",
        width: "100",
        minWidth: "100",
        sortable: false,
        render: function (ui) {
          return `<button class="btn btn-xs btn-default"><i class="fa fa-pen"></i></button>`;
        },
        postRender: function (ui) {
          let rowIndx = ui.rowIndx,
            grid = this,
            $cell = grid.getCell(ui);
          $cell
            .find("button")
            //.button({ icons: { primary: "ui-icon-scissors" } })
            .bind("click", function () {
              grid.addClass({ rowIndx: ui.rowIndx, cls: "pq-row-delete" });
              console.log(this);
              showModal();
              // let ans = window.confirm(
              //   "Are you sure to delete row No " + (rowIndx + 1) + "?"
              // );
              // grid.removeClass({ rowIndx: rowIndx, cls: "pq-row-delete" });
              // if (ans) {
              //   grid.deleteRow({ rowIndx: rowIndx });
              // }
            });
        },
      },
    ];
    const toolbar1 = {
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
    const gridObject = {
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
      postRenderInterval: -1, //call postRender synchronously.
      toolbar: toolbar1,
      colModel: columns1,
      animModel: {
        on: true,
      },
      dataModel: { data: [] },
      // dataModel: GridDataModel({
      //   //pageurl: "/views/changeorder/" + this.selChangeOrderStatus,
      //   url: "/changeorderService/ChangeOrderData/" + this.selChangeOrderStatus,
      // }),
    };

    this.state = {
      gridObject: gridObject,
      showAccountTypeEditForm: false,
    };
  }
  async componentDidMount() {
    let gridObj = this.state.gridObject;
    let DM = Object.assign({}, gridObj.dataModel);
    DM.data = await getData();
    gridObj.dataModel = DM;
    this.setState({ gridObject: gridObj });
    //getData();
  }

  handleChange(event) {
    this.setState({ locale: event.target.value });
  }
  handleChangeOrderFilter(event) {
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
        url: "/designactivity/ChangeOrderData/" + selectedVal,
      });
      //document.location.href = `/views/changeorder/${selChangeOrderStatus}`;
      this.selChangeOrderStatus = selectedVal;
      gridObj.dataModel = DM;
      this.setState({ gridObject: gridObj });
    }
  }

  showModal() {
    this.setState({
      showAccountTypeEditForm: !this.state.showAccountTypeEditForm,
    });
  }
  hideModal() {
    this.setState({
      showAccountTypeEditForm: !this.state.showAccountTypeEditForm,
    });
  }
  render() {
    return (
      <div>
        <div style={{ margin: 20 }}>
          <label>Change locale:</label>
          <select
            value={this.state.gridObject.locale}
            onChange={this.handleChange}
          >
            <option value="en">English</option>
            <option value="ja">Japanese</option>
            <option value="tr">Turkish</option>
          </select>
        </div>
        <button onClick={this.showModal}>Show Modal</button>
        <Modal
          show={this.state.showAccountTypeEditForm}
          backdrop="static"
          onHide={this.hideModal}
          keyboard={false}
        >
          <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title>
          </Modal.Header>
          <Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.hideModal}>
              Close
            </Button>
            <Button variant="primary" onClick={this.hideModal}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        <InitPQGrid options={this.state.gridObject} />
      </div>
    );
  }
}
