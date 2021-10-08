import React from 'react';
import { Link } from "@reach/router";
import {Navbar, Nav, Container} from 'react-bootstrap';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faDatabase} from "@fortawesome/free-solid-svg-icons";
import '../css/RepoHeader.css';

class RepoHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  renderBreadcrumb(link, idx) {
    if (link.link) {
      return (
        <Nav.Link
          as={Link}
          className={idx > 0 ? "path-item" : "path-start"}
          to={link.link}
          key={idx}
        >
          {link.elem}
        </Nav.Link>
      )
    } else {
      return (
        <Nav.Link
          href="#"
          className={idx > 0 ? "path-item": "path-start"}
          key={idx}
        >
          {link.elem}
        </Nav.Link>
      )
    }
  }

  render() {
    return (
      <Navbar
        collapseOnSelect
        bg="secondary"
        variant="dark"
        expand="md"
      >
        <Container fluid>
          <Navbar.Brand>
            <FontAwesomeIcon icon={faDatabase}/>&nbsp;
          </Navbar.Brand>
          <Nav className="me-auto" navbar>
            {this.props.path_list.map(this.renderBreadcrumb)}
          </Nav>
        </Container>
      </Navbar>
    );
  }
}



export default RepoHeader;
