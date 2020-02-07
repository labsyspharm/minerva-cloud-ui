import React from 'react';
import Login from './Login';
import { Link } from "@reach/router";

class Header extends React.Component {
        
    render() {
        return (
            <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
              <Link className="navbar-brand col-sm-3 col-md-2 mr-0" to="/">Minerva</Link>
              <Login loginSuccess={this.props.loginSuccess}/>
            </nav>
        );
      }
}

export default Header;