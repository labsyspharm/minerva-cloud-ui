import React from 'react';
import UserInfo from './UserInfo';
import { Link } from "@reach/router";
import { Navbar, Nav, Container } from 'react-bootstrap';
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
    if (!this.props.login_state.loggedIn) {
      return null;
    }
    return (
      <Navbar
        collapseOnSelect
        bg="dark"
        variant="dark"
        expand="md"
      >
        <Container fluid>
          <Navbar.Brand href="#">
            <img width="180px" src="Minerva-Cloud_HorizLogo_RGB.svg"></img>
          </Navbar.Brand>

          <Navbar.Toggle
            aria-controls="navbar-collapse"
          />

          <Navbar.Collapse id="navbar-collapse">

            <Nav className="mr-auto" navbar>

              <Nav.Link as={Link} to="/repositories">
                Repositories
              </Nav.Link>
              { !this.props.login_state.guest &&
              <Nav.Link as={Link} to="/import">
                Import
              </Nav.Link>
              }
              { !this.props.login_state.guest &&
              <Nav.Link as={Link} to="/permissions">
                Permissions
              </Nav.Link>
              }
            </Nav>
            { this.props.login_state.loggedIn &&
            <UserInfo login_state={this.props.login_state} />
            }

          </Navbar.Collapse>

        </Container>

      </Navbar>
    );
  }
}



export default Header;