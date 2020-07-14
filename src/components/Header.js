import React from 'react';
import UserInfo from './UserInfo';
import { Link } from "@reach/router";
import 'bootstrap/dist/css/bootstrap.min.css';

class Header extends React.Component {

  render() {
    if (!this.props.loggedIn) {
      return null;
    }
    return (
      <nav className="navbar navbar-expand-lg navbar-dark primary-color bg-dark header">

        <a className="navbar-brand bg-dark" href="#">
          <img width="200px" src="Minerva-Cloud_HorizLogo_RGB.svg"></img>
        </a>

        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#basicExampleNav"
          aria-controls="basicExampleNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="basicExampleNav">

          <ul className="navbar-nav mr-auto">

            <li className="nav-item">
              <Link className="nav-link" to="/repositories">Repositories</Link>
            </li>
            { !this.props.guest ? this.renderImportMenu() : null }
            { !this.props.guest ? this.renderPermissionsMenu() : null }
          </ul>
          { this.props.loggedIn ? <UserInfo logoutSuccess={this.props.logoutSuccess} loggedInUser={this.props.loggedInUser} guest={this.props.guest} /> : null }

        </div>

      </nav>
    );
  }

  renderImportMenu() {
    return (
      <li className="nav-item">
        <Link className="nav-link" to="import">Import</Link>
      </li>
    );
  }

  renderPermissionsMenu() {
    return (
      <li className="nav-item">
        <Link className="nav-link" to="permissions">Permissions</Link>
      </li> 
    );
  }

}



export default Header;