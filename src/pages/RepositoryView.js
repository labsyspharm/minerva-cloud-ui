import React from 'react';
import {Badge, Col, Container, Row} from "react-bootstrap";

import "../css/RepositoryView.css";

class RepositoryView extends React.Component {
  constructor(props) {
    super(props);
    console.log(props.repositoryUuid);

    this.state = {}
  }

  render() {
    return (
      <div className="repository-view">
        <Container>
          Repo Name <Badge variant="light">Public/Private</Badge>
          <div className="uuid-display">
            <b>UUID:</b> { this.props.repositoryUuid }
          </div>
          <hr/>
          { ["Image 1", "Image 2"].map((img_name, index) => (
            <Row>
              <Col>
                <b>{ img_name }</b>
              </Col>
              <Col className="text-right">
                Sample
              </Col>
            </Row>
          )) }
        </Container>
      </div>
    )
  }
}

export default RepositoryView;