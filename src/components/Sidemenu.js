import React from 'react';
import { Link } from "@reach/router";

class Sidemenu extends React.Component {

    render() {
        return (
            <nav className="col-md-2 d-none d-md-block bg-light sidebar">
            <div className="sidebar-sticky">
              <ul className="nav nav-fill">
                <li className="nav-item">
                    <Link className="nav-link" to="/">Import images</Link>
                </li>
                <li className="nav-item">
                    <Link className="nav-link" to="repositories">Repositories</Link>
                </li>
              </ul>
            </div>
          </nav>
        );
      }
}

export default Sidemenu;