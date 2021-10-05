import React from 'react';
import Client from "../MinervaClient";
import {Container, Col, Row } from "react-bootstrap";
import Badge from "react-bootstrap/Badge";

import "../css/RepositoryList.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faDatabase, faImage} from "@fortawesome/free-solid-svg-icons";
import {Link} from "@reach/router";

class RepositoryList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      repositories: [],
      loading: true,
    }
  }

  componentDidMount() {
    this.getRepositories();
  }

  getRepositories() {
    if (!Client.loggedIn()) {
      this.setState({repositories: null});
      return;
    }
    Client.getRepositories().then(repos => {
      // Handle successful response.
      console.log(repos);
      let repositories = [];
      for (let repo of repos.included.repositories) {
        repositories.push({
          uuid: repo.uuid,
          name: repo.name,
          access: repo.access
        })
      }
      this.setState({
        repositories: repositories,
        loading: false
      })
    }).catch(err => {
      // Handle Error
      console.error(err);
      this.setState({
        loading: false,
      })
    });
  }

  render() {
    return (
      <div className="repository-list">
        <Container>
          <FontAwesomeIcon icon={faDatabase}></FontAwesomeIcon>&nbsp;Repositories
          <hr/>
          { this.state.loading && "Loading..." }
          { this.state.repositories.map((item, index) => (
            <div
              className="repo-row"
              key={ item.uuid }
            >
              <Row>
                <Col lg="6">
                  <Link className="repo-link" to={`/repositories/${item.uuid}`}>
                    <b>{ item.name }</b>
                  </Link>
                  <Badge variant="light" text="dark">
                    { item.access }
                  </Badge>
                </Col>
                <Col lg="4">
                  { item.uuid }
                </Col>
                <Col className="text-right" lg="2">
                  <FontAwesomeIcon icon={faImage}></FontAwesomeIcon>
                </Col>
              </Row>
            </div>
          ))}
        </Container>
      </div>
    );
  }
}

export default RepositoryList;