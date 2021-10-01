import React from 'react';
import UserInfo from './UserInfo';
import { Link } from "@reach/router";
import {
  Navbar,
  Nav,
  NavLink,
  NavbarToggler,
  NavbarBrand,
  NavItem,
  Collapse
} from "reactstrap";
import '../css/Header.css';

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      is_open: false
    };

    this.toggle = this.toggle.bind(this)
  }

  toggle() {
    let was_open = this.state.is_open;
    this.setState({
      is_open: !was_open
    })
  }

  render() {
    if (!this.props.loggedIn) {
      return null;
    }
    return (
      <Navbar
        className="bg-dark"
        color="darK"
        dark
        expand="md"
      >
        <NavbarBrand href="#">
          <img width="180px" src="Minerva-Cloud_HorizLogo_RGB.svg"></img>
        </NavbarBrand>

        <NavbarToggler
          onClick={this.toggle}
        />

        <Collapse isOpen={this.state.is_open} navbar>

          <Nav className="mr-auto" navbar>

            <NavItem>
              <NavLink tag={Link} to="/repositories">Repositories</NavLink>
            </NavItem>
            { !this.props.guest &&
              <NavItem>
                <NavLink tag={Link} to="/import">Import</NavLink>
              </NavItem>
            }
            { !this.props.guest &&
              <NavItem>
                <NavLink tag={Link} to="/permissions">Permissions</NavLink>
              </NavItem>
            }
          </Nav>
          { this.props.loggedIn &&
            <UserInfo logoutSuccess={this.props.logoutSuccess} 
              loggedInUser={this.props.loggedInUser} 
              guest={this.props.guest} /> 
          }

        </Collapse>

      </Navbar>
    );
  }
}



export default Header;