import React from 'react';
import Login from './Login';
import { Link } from "@reach/router";
import 'bootstrap/dist/css/bootstrap.min.css';

class Header extends React.Component {

  render() {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark primary-color bg-dark header">

        <a className="navbar-brand bg-dark" href="#">MINERVA</a>

        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#basicExampleNav"
          aria-controls="basicExampleNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="basicExampleNav">

          <ul className="navbar-nav mr-auto">

            <li className="nav-item">
              <Link className="nav-link" to="/">Repositories</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="import">Import</Link>
            </li>


          </ul>
          <Login loginSuccess={this.props.loginSuccess} logoutSuccess={this.props.logoutSuccess} />

        </div>

      </nav>
    );
  }
}

export default Header;