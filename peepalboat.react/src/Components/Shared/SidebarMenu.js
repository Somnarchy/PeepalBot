// SideBar.js
import React, { Component } from "react";
import Navbar from "react-bootstrap/Navbar";
import { Link } from "react-router-dom";

export default class SidebarMenu extends Component {
  render() {
    return (
      <aside className="main-sidebar sidebar-dark-primary elevation-4">
        <Link to="/" className="brand-link">
          <img
            src="/peepal.tree.jpg"
            alt="AdminLTE Logo"
            className="brand-image img-circle elevation-3"
            style={{ opacity: 0.8 }}
          />
          <span className="brand-text font-weight-light">PeepalBot</span>
        </Link>
        <div className="sidebar">
          <div className="user-panel mt-3 pb-3 mb-3 d-flex">
            <div className="image">
              <img
                src="dist/img/user2-160x160.jpg"
                className="img-circle elevation-2"
                alt="User Image"
              />
            </div>
            <div className="info">
              <a href="#" className="d-block">
                Subin Dongol
              </a>
            </div>
          </div>

          <nav className="mt-2">
            <ul
              className="nav nav-pills nav-sidebar flex-column nav-flat text-sm"
              data-widget="treeview"
              role="menu"
              data-accordion="false"
            >
              <li className="nav-item menu-open">
                <a href="#" className="nav-link active">
                  <i className="nav-icon fas fa-tachometer-alt"></i>
                  <p>
                    App Settings
                    <i className="right fas fa-angle-left"></i>
                  </p>
                </a>
                <ul className="nav nav-treeview">
                  <li className="nav-item">
                    <Link to="/accounttype" className="nav-link active">
                      <i className="far fa-circle nav-icon"></i>Account Type
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/transactiontype" className="nav-link">
                      <i className="far fa-circle nav-icon"></i>Transaction Type
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/documenttype" className="nav-link">
                      <i className="far fa-circle nav-icon"></i>Document Type
                    </Link>
                  </li>
                </ul>
              </li>
              <li className="nav-item menu-open">
                <a href="#" className="nav-link">
                  <i className="nav-icon fas fa-tachometer-alt"></i>
                  <p>
                    User Mgmt
                    <i className="right fas fa-angle-left"></i>
                  </p>
                </a>
                <ul className="nav nav-treeview">
                  <li className="nav-item">
                    <Link to="/customer" className="nav-link">
                      <i className="far fa-circle nav-icon"></i>Customer
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/customercocument" className="nav-link">
                      <i className="far fa-circle nav-icon"></i>Customer
                      Document
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    );
  }
}
