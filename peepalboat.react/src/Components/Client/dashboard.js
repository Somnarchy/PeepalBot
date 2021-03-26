import React, { Component, useState } from "react";
import { Card } from "react-bootstrap";
function Example() {
  const [showA, setShowA] = useState(true);
  const toggleShowA = () => setShowA(!showA);

  return (
    <div className="row">
      <div className="col-lg-6">
        <div className="card">
          <div className="card-header with-border">
            <h3 className="card-title">Dashboard-</h3>
            <div className="card-tools">
              <button
                type="button"
                className="btn btn-tool"
                onClick={toggleShowA}
              >
                <i className="fas fa-minus"></i>
              </button>
              <button type="button" className="btn btn-tool">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div
            className={
              showA === true
                ? "card-body collapse show"
                : "card-body collapse hide"
            }
          >
            <div className="row">
              <div className="col-md-8">
                <p className="text-center">
                  <strong>This is text</strong>
                </p>
              </div>
            </div>
          </div>
          <div
            className={
              showA === true
                ? "card-footer collapse show"
                : "card-footer collapse hide"
            }
          >
            <div className="row">
              <div className="col-sm-3 col-xs-6">
                <div className="description-block border-right">
                  <span className="description-percentage text-green">
                    <i className="fa fa-caret-up"></i> 17%
                  </span>
                  <h5 className="description-header">$35,210.43</h5>
                  <span className="description-text">TOTAL REVENUE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-6">
        <div className="card">
          <div className="card-header with-border">
            <h3 className="card-title">Dashboard-</h3>
            <div className="card-tools">
              <button
                type="button"
                className="btn btn-tool"
                data-card-widget="collapse"
              >
                <i className="fas fa-minus"></i>
              </button>
              <button
                type="button"
                className="btn btn-tool"
                data-card-widget="remove"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <p className="text-center">
                  <strong>This is text</strong>
                </p>
              </div>
            </div>
          </div>
          <div className="card-footer">
            <div className="row">
              <div className="col-sm-3 col-xs-6">
                <div className="description-block border-right">
                  <span className="description-percentage text-green">
                    <i className="fa fa-caret-up"></i> 17%
                  </span>
                  <h5 className="description-header">$35,210.43</h5>
                  <span className="description-text">TOTAL REVENUE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default class Dashboard extends Component {
  render() {
    return <Example></Example>;
  }
}
